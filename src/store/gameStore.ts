import { LocalStoragePersistence } from '../persistence/localStoragePersistence';
import { SCHEMA_VERSION } from '../persistence/schema';

import { create } from 'zustand';
import type { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';
import { getLegalMovesAvoidingCheck, isInCheck, isCheckmate, isStalemate } from '../engine/validation/checkDetection';
import { createSquareId } from '../engine/world/coordinates';
import { getInitialPinPositions } from '../engine/world/pinPositions';
import { makeInstanceId, parseInstanceId } from '../engine/world/attackBoardAdjacency';
import { updateInstanceVisibility, setVisibleInstances } from '../engine/world/visibility';
import { validateActivation, executeActivation } from '../engine/world/worldMutation';
import { getArrivalOptions } from '../engine/world/coordinatesTransform';
import { resolveBoardId } from '../utils/resolveBoardId';
import { validateCastle, type CastleType } from '../engine/validation/castleValidator';
import { checkPromotion } from '../engine/validation/promotionRules';
export interface GameSnapshot {
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: 'white' | 'black' | null;
  gameOver: boolean;
  attackBoardPositions: Record<string, string>;
  moveHistory: Move[];
  boardRotations: Record<string, number>;
  attackBoardActivatedThisTurn: boolean;
}

const __snapshots: GameSnapshot[] = [];

function takeSnapshot(state: GameState): GameSnapshot {
  const boardRotations: Record<string, number> = {};
  Array.from(state.world.boards.keys()).forEach((id) => {
    boardRotations[id] = state.world.boards.get(id)?.rotation ?? 0;
  });
  return {
    pieces: state.pieces.map((p) => ({ ...p })),
    currentTurn: state.currentTurn,
    isCheck: state.isCheck,
    isCheckmate: state.isCheckmate,
    isStalemate: state.isStalemate,
    winner: state.winner,
    gameOver: state.gameOver,
    attackBoardPositions: { ...state.attackBoardPositions },
    moveHistory: state.moveHistory.slice(),
    boardRotations,
    attackBoardActivatedThisTurn: state.attackBoardActivatedThisTurn,
  };
}

function restoreSnapshot(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  snap: GameSnapshot
) {
  const pinNum = (id: string | undefined) => Number((id ?? '').slice(2)) || 1;
  const rot = (boardId: string) => ((snap.boardRotations[boardId] ?? 0) === 180 ? 180 : 0) as 0 | 180;
  const derivedTrackStates = {
    QL: { whiteBoardPin: pinNum(snap.attackBoardPositions['WQL']), blackBoardPin: pinNum(snap.attackBoardPositions['BQL']), whiteRotation: rot('WQL'), blackRotation: rot('BQL') },
    KL: { whiteBoardPin: pinNum(snap.attackBoardPositions['WKL']), blackBoardPin: pinNum(snap.attackBoardPositions['BKL']), whiteRotation: rot('WKL'), blackRotation: rot('BKL') },
  };

  // Derive attackBoardStates from positions and rotations
  const derivedAttackBoardStates: Record<string, { activeInstanceId: string }> = {};
  for (const [boardId, pinId] of Object.entries(snap.attackBoardPositions)) {
    // Use pin's track for cross-track moves (e.g., WQL at KL2 should be KL2:0)
    const track = pinId.startsWith('QL') ? 'QL' : 'KL';
    const pin = pinNum(pinId);
    const rotation = rot(boardId);
    derivedAttackBoardStates[boardId] = {
      activeInstanceId: makeInstanceId(track as 'QL' | 'KL', pin, rotation),
    };
  }

  const state = get();

  // Use setVisibleInstances with the derived attackBoardStates
  const instancesToShow = [
    derivedAttackBoardStates.WQL?.activeInstanceId,
    derivedAttackBoardStates.WKL?.activeInstanceId,
    derivedAttackBoardStates.BQL?.activeInstanceId,
    derivedAttackBoardStates.BKL?.activeInstanceId,
  ].filter(Boolean) as string[];

  setVisibleInstances(state.world, instancesToShow);

  set({
    world: { ...state.world },  // Create new reference for Zustand
    pieces: snap.pieces,
    currentTurn: snap.currentTurn,
    isCheck: snap.isCheck,
    isCheckmate: snap.isCheckmate,
    isStalemate: snap.isStalemate,
    winner: snap.winner,
    gameOver: snap.gameOver,
    attackBoardPositions: snap.attackBoardPositions,
    attackBoardStates: derivedAttackBoardStates,  // Restore attackBoardStates
    moveHistory: snap.moveHistory,
    trackStates: derivedTrackStates,
    selectedSquareId: null,
    highlightedSquareIds: [],
    castleDestinations: [],
    selectedBoardId: null,
    attackBoardActivatedThisTurn: snap.attackBoardActivatedThisTurn,
  });

  state.updateGameState();
}



export interface PromotionState {
  isDeferred: boolean;           // True if on deferred corner
  overhangBoardId?: string;      // Which board is blocking (e.g., 'BQL')
  canPromote: boolean;           // True if at furthest rank
  forcedPromotion?: boolean;     // True if auto-promotion pending
}

export interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string;
  hasMoved: boolean;
  movedByAB?: boolean;
  promotionState?: PromotionState;
}

export type Move = 
  | {
      type: 'piece-move';
      from: string;
      to: string;
      piece: { type: string; color: 'white' | 'black' };
    }
  | {
      type: 'board-move';
      from: string;
      to: string;
      boardId: string;
      rotation?: number;
    }
  | {
      type: 'castle';
      castleType: 'kingside-ql' | 'kingside-kl' | 'queenside';
      color: 'white' | 'black';
      kingFrom: string;
      kingTo: string;
      rookFrom: string;
      rookTo: string;
    };

export interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  selectedSquareId: string | null;
  highlightedSquareIds: string[];
  castleDestinations: Array<{
    squareId: string;
    castleType: CastleType;
  }>;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: 'white' | 'black' | null;
  gameOver: boolean;
  attackBoardPositions: Record<string, string>;
  attackBoardStates?: Record<string, { activeInstanceId: string }>;
  selectedBoardId: string | null;
  moveHistory: Move[];
  trackStates?: {
    QL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
    KL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
  };
  interactionMode?: 'idle' | 'selectPin' | 'selectArrival';
  arrivalOptions?: Array<{ choice: 'identity' | 'rot180'; file: number; rank: number }> | null;
  selectedToPinId?: string | null;
  attackBoardActivatedThisTurn: boolean;

  // Promotion state management
  promotionPending?: {
    pieceId: string;
    squareId: string;
    choices: ('queen' | 'rook' | 'bishop' | 'knight')[];
    isForced: boolean;
    triggeredBy: 'move' | 'geometry';
  };
  deferredPromotions: Array<{
    pieceId: string;
    squareId: string;
    overhangBoardId: string;
  }>;

  setArrivalSelection?: (toPinId: string) => void;
  clearArrivalSelection?: () => void;


  selectSquare: (squareId: string) => void;
  movePiece: (piece: Piece, toFile: number, toRank: number, toLevel: string) => void;
  clearSelection: () => void;
  resetGame: () => void;
  getValidMovesForSquare: (squareId: string) => string[];
  updateGameState: () => void;
  saveCurrentGame: (name?: string) => Promise<void>;
  loadGameById: (id: string) => Promise<void>;
  deleteGameById: (id: string) => Promise<void>;
  exportGameById: (id: string) => Promise<string>;
  importGameFromJson: (json: string) => Promise<void>;
  selectBoard: (boardId: string | null) => void;
  canMoveBoard: (boardId: string, toPinId: string) => { allowed: boolean; reason?: string };
  moveAttackBoard: (boardId: string, toPinId: string, rotate?: boolean, arrivalChoice?: 'identity' | 'rot180') => void;
  canRotate: (boardId: string, angle: 0 | 180) => { allowed: boolean; reason?: string };
  rotateAttackBoard: (boardId: string, angle: 0 | 180) => void;
  undoMove: () => void;
  getActiveInstance: (boardId: string) => string;
  setActiveInstance: (boardId: string, instanceId: string) => void;
  executeCastle: (castleType: 'kingside-ql' | 'kingside-kl' | 'queenside') => void;

  // Promotion actions
  initiatePromotion: (pieceId: string, squareId: string, isForced: boolean, triggeredBy: 'move' | 'geometry') => void;
  executePromotion: (pieceType: 'queen' | 'rook' | 'bishop' | 'knight') => void;
  checkForcedPromotions: () => void;
}
const __persistence = new LocalStoragePersistence();


function boardIdToLevel(boardId: string): string {
  if (boardId === 'WL') return 'W';
  if (boardId === 'NL') return 'N';
  if (boardId === 'BL') return 'B';
  return boardId;
}

function instanceIdToBoardId(instanceId: string, attackBoardStates?: Record<string, { activeInstanceId: string }>): string | null {
  console.log('[instanceIdToBoardId] Converting:', { instanceId, attackBoardStates });

  // Check if this is a main board
  if (instanceId === 'WL' || instanceId === 'NL' || instanceId === 'BL' || instanceId === 'W' || instanceId === 'N' || instanceId === 'B') {
    console.log('[instanceIdToBoardId] Is main board, returning:', instanceId);
    return instanceId;
  }

  if (!attackBoardStates) {
    console.log('[instanceIdToBoardId] No attackBoardStates provided, returning null');
    return null;
  }

  // Find which board ID has this active instance
  for (const [boardId, state] of Object.entries(attackBoardStates)) {
    console.log('[instanceIdToBoardId] Checking:', { boardId, activeInstanceId: state.activeInstanceId, matches: state.activeInstanceId === instanceId });
    if (state.activeInstanceId === instanceId) {
      console.log('[instanceIdToBoardId] Found match! Returning:', boardId);
      return boardId;
    }
  }

  console.log('[instanceIdToBoardId] No match found, returning null');
  return null;
}

const initialWorld = createChessWorld();
const initialTrackStates = {
  QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 } as const,
  KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 } as const,
};

updateInstanceVisibility(initialWorld, initialTrackStates);

export const useGameStore = create<GameState>()((set, get) => ({
  world: initialWorld,
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  castleDestinations: [],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  winner: null,
  gameOver: false,
  attackBoardPositions: getInitialPinPositions(),
  attackBoardStates: {
    WQL: { activeInstanceId: 'QL1:0' },
    WKL: { activeInstanceId: 'KL1:0' },
    BQL: { activeInstanceId: 'QL6:0' },
    BKL: { activeInstanceId: 'KL6:0' },
  },
  trackStates: initialTrackStates,
  selectedBoardId: null,
  attackBoardActivatedThisTurn: false,

  // Promotion state
  promotionPending: undefined,
  deferredPromotions: [],
  setArrivalSelection: (toPinId: string) => {
    const state = get();
    const boardId = state.selectedBoardId;
    if (!boardId) {
      set({
        interactionMode: 'idle',
        arrivalOptions: null,
        selectedToPinId: null,
      });
      return;
    }

    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) {
      set({
        interactionMode: 'idle',
        arrivalOptions: null,
        selectedToPinId: null,
      });
      return;
    }

    const track = (boardId.includes('QL') ? 'QL' : 'KL') as 'QL' | 'KL';
    const fromPin = parseInt(fromPinId.slice(2), 10);
    const toPin = parseInt(toPinId.slice(2), 10);

    const trackState = state.trackStates?.[track];
    if (!trackState) {
      set({
        interactionMode: 'idle',
        arrivalOptions: null,
        selectedToPinId: null,
      });
      return;
    }

    const isWhiteBoard = boardId.startsWith('W');
    const fromRotation = isWhiteBoard ? trackState.whiteRotation : trackState.blackRotation;
    const toRotation = fromRotation; // For now, assume no rotation change (will be handled separately)

    const passengers = state.pieces.filter(p => p.level === boardId);
    
    if (passengers.length === 0) {
      const options = [
        { choice: 'identity' as const, file: 0, rank: 0 },
      ];
      set({
        interactionMode: 'selectArrival',
        arrivalOptions: options,
        selectedToPinId: toPinId,
      });
      return;
    }

    const passenger = passengers[0];
    const baseFile = track === 'QL' ? 0 : 4;
    const pinRankOffsets: Record<number, number> = { 1: 0, 2: 4, 3: 2, 4: 6, 5: 4, 6: 8 };
    const baseRank = pinRankOffsets[fromPin];
    
    const localFile = passenger.file - baseFile;
    const localRank = passenger.rank - baseRank;

    const options = getArrivalOptions(
      track,
      fromPin,
      toPin,
      fromRotation,
      toRotation,
      localFile,
      localRank
    );

    set({
      interactionMode: 'selectArrival',
      arrivalOptions: options,
      selectedToPinId: toPinId,
    });
  },
  clearArrivalSelection: () => {
    set({
      interactionMode: 'idle',
      arrivalOptions: null,
      selectedToPinId: null,
    });
  },

  moveHistory: [],
  interactionMode: 'idle',
  arrivalOptions: null,
  selectedToPinId: null,


  
  selectSquare: (squareId: string) => {
    const state = get();

    if (state.gameOver) {
      return;
    }

    if (!state.selectedSquareId) {
      const piece = state.pieces.find((p) => {
        const resolvedLevel = resolveBoardId(p.level, state.attackBoardStates);
        const pieceSquareId = createSquareId(p.file, p.rank, resolvedLevel);
        return pieceSquareId === squareId;
      });

      if (piece && piece.color === state.currentTurn) {
        const validMoves = get().getValidMovesForSquare(squareId);
        // Note: castleDestinations are set inside getValidMovesForSquare
        set({
          selectedSquareId: squareId,
          highlightedSquareIds: validMoves,
          selectedBoardId: null,
        });
      }
    } else {
      // Check if the clicked square is a castle destination
      const castleDestination = state.castleDestinations.find(
        (cd) => cd.squareId === squareId
      );

      if (castleDestination) {
        // Execute the castle
        get().executeCastle(castleDestination.castleType);
        return;
      }

      if (state.highlightedSquareIds.includes(squareId)) {
        const selectedPiece = state.pieces.find((p) => {
          const resolvedLevel = resolveBoardId(p.level, state.attackBoardStates);
          const pieceSquareId = createSquareId(p.file, p.rank, resolvedLevel);
          return pieceSquareId === state.selectedSquareId;
        });

        if (selectedPiece) {
          const targetSquare = Array.from(state.world.squares.values()).find(
            (sq) => sq.id === squareId
          );
          if (targetSquare) {
            get().movePiece(selectedPiece, targetSquare.file, targetSquare.rank, boardIdToLevel(targetSquare.boardId));
          }
        }
      } else {
        const piece = state.pieces.find((p) => {
          const resolvedLevel = resolveBoardId(p.level, state.attackBoardStates);
          const pieceSquareId = createSquareId(p.file, p.rank, resolvedLevel);
          return pieceSquareId === squareId;
        });

        if (piece && piece.color === state.currentTurn) {
          const validMoves = get().getValidMovesForSquare(squareId);
          // Note: castleDestinations are set inside getValidMovesForSquare
          set({
            selectedSquareId: squareId,
            highlightedSquareIds: validMoves,
            selectedBoardId: null,
          });
        } else {
          set({ selectedSquareId: null, highlightedSquareIds: [], castleDestinations: [] });
        }
      }
    }
  },
  
  movePiece: (piece: Piece, toFile: number, toRank: number, toLevel: string) => {
    const state = get();

    const capturedPiece = state.pieces.find(
      (p) => p.file === toFile && p.rank === toRank && p.level === toLevel
    );

    const updatedPieces = state.pieces.filter((p) => p.id !== capturedPiece?.id);

    const movedPieceIndex = updatedPieces.findIndex((p) => p.id === piece.id);
    if (movedPieceIndex !== -1) {
      updatedPieces[movedPieceIndex] = {
        ...piece,
        file: toFile,
        rank: toRank,
        level: toLevel,
        hasMoved: true,
      };
    }

    const fromSquare = state.world.squares.get(createSquareId(piece.file, piece.rank, piece.level));
    const toSquare = state.world.squares.get(createSquareId(toFile, toRank, toLevel));

    // Check for promotion (only if piece is a pawn)
    if (piece.type === 'pawn' && toSquare && state.trackStates) {
      const promotionCheck = checkPromotion(
        piece,
        toSquare,
        state.trackStates,
        state.world,
        state.attackBoardStates
      );

      if (promotionCheck.shouldPromote) {
        console.log('[movePiece] Promotion detected:', promotionCheck);

        const move: Move = {
          type: 'piece-move',
          from: fromSquare?.id || '',
          to: toSquare?.id || '',
          piece: { type: piece.type, color: piece.color },
        };

        __snapshots.push(takeSnapshot(state));

        if (promotionCheck.isDeferred) {
          // Deferred promotion - add to tracking and update piece state
          const updatedPiecesWithPromotion = updatedPieces.map((p) => {
            if (p.id === piece.id) {
              return {
                ...p,
                promotionState: {
                  isDeferred: true,
                  overhangBoardId: promotionCheck.overhangBoardId,
                  canPromote: false,
                },
              };
            }
            return p;
          });

          set({
            pieces: updatedPiecesWithPromotion,
            moveHistory: [...state.moveHistory, move],
            deferredPromotions: [
              ...state.deferredPromotions,
              {
                pieceId: piece.id,
                squareId: toSquare.id,
                overhangBoardId: promotionCheck.overhangBoardId!,
              },
            ],
            selectedSquareId: null,
            highlightedSquareIds: [],
            castleDestinations: [],
          });

          console.log('[movePiece] Deferred promotion added for piece', piece.id);

          // Still change turns for deferred promotion
          const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';
          set({ currentTurn: nextTurn, attackBoardActivatedThisTurn: false });
          get().updateGameState();

          return;
        } else if (promotionCheck.canPromote) {
          // Immediate promotion - set pieces but don't change turn yet
          set({
            pieces: updatedPieces,
            moveHistory: [...state.moveHistory, move],
            selectedSquareId: null,
            highlightedSquareIds: [],
            castleDestinations: [],
          });

          // Trigger promotion UI (turn will change after promotion completes)
          get().initiatePromotion(piece.id, toSquare.id, false, 'move');

          console.log('[movePiece] Immediate promotion initiated for piece', piece.id);

          return;
        }
      }
    }

    // Normal move (no promotion)
    const move: Move = {
      type: 'piece-move',
      from: fromSquare?.id || '',
      to: toSquare?.id || '',
      piece: { type: piece.type, color: piece.color },
    };

    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    const checkStatus = isInCheck(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);
    const checkmateStatus = isCheckmate(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);
    const stalemateStatus = isStalemate(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);

    __snapshots.push(takeSnapshot(state));
    set({
      pieces: updatedPieces,
      moveHistory: [...state.moveHistory, move],
      currentTurn: nextTurn,
      selectedSquareId: null,
      highlightedSquareIds: [],
      castleDestinations: [],
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      gameOver: checkmateStatus || stalemateStatus,
      winner: checkmateStatus ? state.currentTurn : (stalemateStatus ? null : state.winner),
      attackBoardActivatedThisTurn: false, // Reset on turn change
    });
  },

  undoMove: () => {
    if (__snapshots.length === 0) return;
    const snap = __snapshots.pop()!;
    restoreSnapshot(set, get, snap);
  },
  
  clearSelection: () => {
    set({ selectedSquareId: null, highlightedSquareIds: [], castleDestinations: [], selectedBoardId: null });
  },

  selectBoard: (boardId: string | null) => {
    console.log('[selectBoard] Called with:', boardId);
    if (boardId === null) {
      set({ selectedBoardId: null });
    } else {
      const state = get();
      console.log('[selectBoard] Current attackBoardStates:', state.attackBoardStates);
      // Convert instance ID to board ID if necessary
      const actualBoardId = instanceIdToBoardId(boardId, state.attackBoardStates) || boardId;
      console.log('[selectBoard] Setting selectedBoardId to:', actualBoardId);
      set({
        selectedBoardId: actualBoardId,
        selectedSquareId: null,
        highlightedSquareIds: [],
        castleDestinations: [],
      });
    }
  },
  
  resetGame: () => {
    const newWorld = createChessWorld();
    const newTrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 } as const,
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 } as const,
    };

    updateInstanceVisibility(newWorld, newTrackStates);

    set({
      world: newWorld,
      pieces: createInitialPieces(),
      currentTurn: 'white',
      selectedSquareId: null,
      highlightedSquareIds: [],
      castleDestinations: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      winner: null,
      gameOver: false,
      attackBoardPositions: getInitialPinPositions(),
      attackBoardStates: {
        WQL: { activeInstanceId: 'QL1:0' },
        WKL: { activeInstanceId: 'KL1:0' },
        BQL: { activeInstanceId: 'QL6:0' },
        BKL: { activeInstanceId: 'KL6:0' },
      },
      trackStates: newTrackStates,
      selectedBoardId: null,
      moveHistory: [],
      attackBoardActivatedThisTurn: false,
      promotionPending: undefined,
      deferredPromotions: [],
    });
  },

  getValidMovesForSquare: (squareId: string) => {
    const state = get();

    console.warn(`🔍 PIECE SELECTED: ${squareId}`);

    const piece = state.pieces.find((p) => {
      const resolvedLevel = resolveBoardId(p.level, state.attackBoardStates);
      const pieceSquareId = createSquareId(p.file, p.rank, resolvedLevel);
      return pieceSquareId === squareId;
    });

    if (!piece) {
      console.warn(`❌ NO PIECE at ${squareId}`);
      return [];
    }

    console.warn(`✅ FOUND:`, piece.type, piece.color, `at ${squareId}`);

    if (piece.color !== state.currentTurn) {
      console.warn(`❌ WRONG TURN - piece is ${piece.color}, turn is ${state.currentTurn}`);
      return [];
    }

    const moves = getLegalMovesAvoidingCheck(piece, state.world, state.pieces, state.attackBoardStates, state.trackStates);
    console.error(`🎯 ${moves.length} LEGAL MOVES:`, moves);

    // If the selected piece is a king, check for available castles
    const castleDestinations: Array<{ squareId: string; castleType: CastleType }> = [];
    if (piece.type === 'king') {
      const castleTypes: CastleType[] = ['kingside-ql', 'kingside-kl', 'queenside'];

      for (const castleType of castleTypes) {
        const validation = validateCastle({
          color: state.currentTurn,
          castleType,
          pieces: state.pieces,
          world: state.world,
          trackStates: state.trackStates ?? {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          currentTurn: state.currentTurn,
          attackBoardActivatedThisTurn: state.attackBoardActivatedThisTurn,
        });

        if (validation.valid && validation.kingTo) {
          // Convert board ID to instance ID for square lookup
          const resolvedLevel = resolveBoardId(validation.kingTo.level, state.attackBoardStates);

          // Create the square ID for the king's destination
          const kingDestSquareId = createSquareId(
            validation.kingTo.file,
            validation.kingTo.rank,
            resolvedLevel
          );
          castleDestinations.push({
            squareId: kingDestSquareId,
            castleType,
          });
        }
      }
    }

    // Update the store with castle destinations
    set({ castleDestinations });

    return moves;
  },

  updateGameState: () => {
    const state = get();
    const currentPlayer = state.currentTurn;

    const checkStatus = isInCheck(currentPlayer, state.world, state.pieces, state.attackBoardStates, state.trackStates);
    const checkmateStatus = isCheckmate(currentPlayer, state.world, state.pieces, state.attackBoardStates, state.trackStates);
    const stalemateStatus = isStalemate(currentPlayer, state.world, state.pieces, state.attackBoardStates, state.trackStates);

    set({
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      winner: checkmateStatus 
        ? (currentPlayer === 'white' ? 'black' : 'white')
        : (stalemateStatus ? null : state.winner),
    });
  },

  saveCurrentGame: async (name?: string) => {
    const state = get();
    await __persistence.saveGame({
      version: SCHEMA_VERSION,
      id: undefined,
      name: name ?? 'Manual Save',
      payload: buildPersistablePayload(state),
      integrity: { schemaVersion: SCHEMA_VERSION },
      meta: { source: 'local' },
    });
  },

  loadGameById: async (id: string) => {
    const doc = await __persistence.loadGame(id);
    if (!doc) return;
    hydrateFromPersisted(set, get, doc.payload);
  },

  deleteGameById: async (id: string) => {
    await __persistence.deleteGame(id);
  },

  exportGameById: async (id: string) => {
    return await __persistence.exportGame(id);
  },

  canMoveBoard: (boardId: string, toPinId: string) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) return { allowed: false, reason: 'Unknown board' };
    if (fromPinId === toPinId) return { allowed: false, reason: 'Board is already at this position' };
    const result = validateActivation({
      boardId,
      fromPinId,
      toPinId,
      rotate: false,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    return { allowed: result.isValid, reason: result.reason };
  },

  moveAttackBoard: (boardId: string, toPinId: string, rotate = false, arrivalChoice?: 'identity' | 'rot180') => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) return;

    console.log('[moveAttackBoard] START', {
      boardId,           // e.g., 'WQL'
      fromPinId,         // e.g., 'QL1'
      toPinId,           // e.g., 'QL2'
      rotate,            // false
      arrivalChoice,     // 'identity' or 'rot180'
      currentTurn: state.currentTurn,
    });

    // Log passengers BEFORE
    const passengers = state.pieces.filter(p => p.level === boardId);
    console.log('[moveAttackBoard] Passengers BEFORE:', passengers.map(p => ({
      type: p.type,
      color: p.color,
      level: p.level,
      file: p.file,
      rank: p.rank,
      squareId: `${['z','a','b','c','d','e'][p.file]}${p.rank}${p.level}`,
    })));

    // Log current state BEFORE
    console.log('[moveAttackBoard] State BEFORE:', {
      attackBoardPositions: state.attackBoardPositions,
      attackBoardStates: state.attackBoardStates,
      trackStates: state.trackStates,
    });

    const validation = validateActivation({
      boardId,
      fromPinId,
      toPinId,
      rotate,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    console.log('[moveAttackBoard] Validation:', validation);
    if (!validation.isValid) return;

    const result = executeActivation({
      boardId,
      fromPinId,
      toPinId,
      rotate,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
      arrivalChoice,
    });

    console.log('[moveAttackBoard] Execution result:', {
      activeInstanceId: result.activeInstanceId,
      updatedPositions: result.updatedPositions,
      updatedPiecesCount: result.updatedPieces.length,
    });

    // Log passengers AFTER execution
    const updatedPassengers = result.updatedPieces.filter(p => p.level === boardId);
    console.log('[moveAttackBoard] Passengers AFTER execution:', updatedPassengers.map(p => ({
      type: p.type,
      color: p.color,
      level: p.level,
      file: p.file,
      rank: p.rank,
      squareId: `${['z','a','b','c','d','e'][p.file]}${p.rank}${p.level}`,
    })));

    const move: Move = {
      type: 'board-move',
      from: fromPinId,
      to: toPinId,
      boardId,
      rotation: rotate ? 180 : undefined,
    };

    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    __snapshots.push(takeSnapshot(state));

    // Build new attackBoardStates
    const newAttackBoardStates = {
      ...(state.attackBoardStates ?? {}),
      [boardId]: {
        activeInstanceId: result.activeInstanceId,
      },
    };
    console.log('[moveAttackBoard] attackBoardStates update:', {
      before: state.attackBoardStates,
      after: newAttackBoardStates,
    });

    // Derive the 4 instance IDs to show from attackBoardStates
    const instancesToShow = [
      newAttackBoardStates.WQL?.activeInstanceId,
      newAttackBoardStates.WKL?.activeInstanceId,
      newAttackBoardStates.BQL?.activeInstanceId,
      newAttackBoardStates.BKL?.activeInstanceId,
    ].filter(Boolean) as string[];

    console.log('[moveAttackBoard] Calling setVisibleInstances BEFORE set()...', instancesToShow);
    setVisibleInstances(state.world, instancesToShow);

    // Calculate trackStates for backwards compatibility (not used for visibility anymore)
    const parsed = parseInstanceId(result.activeInstanceId);
    console.log('[moveAttackBoard] Parsed activeInstanceId:', parsed);
    const nextTrackStates = { ...(state.trackStates ?? { QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 }, KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 } }) };
    if (parsed) {
      const isWhite = boardId.startsWith('W');
      const t = parsed.track as 'QL' | 'KL';
      if (isWhite) {
        nextTrackStates[t] = { ...nextTrackStates[t], whiteBoardPin: parsed.pin, whiteRotation: parsed.rotation as 0|180 };
      } else {
        nextTrackStates[t] = { ...nextTrackStates[t], blackBoardPin: parsed.pin, blackRotation: parsed.rotation as 0|180 };
      }
    }

    console.log('[moveAttackBoard] Calling set() with:', {
      piecesCount: result.updatedPieces.length,
      attackBoardPositions: result.updatedPositions,
      attackBoardStates: newAttackBoardStates,
      trackStates: nextTrackStates,
      nextTurn,
    });

    set({
      world: { ...state.world },  // Create new reference so Zustand detects the change
      pieces: result.updatedPieces,
      attackBoardPositions: result.updatedPositions,
      moveHistory: [...state.moveHistory, move],
      selectedBoardId: boardId,
      currentTurn: nextTurn,
      attackBoardStates: newAttackBoardStates,
      trackStates: nextTrackStates,
      attackBoardActivatedThisTurn: true, // Mark that attack board was activated
    });

    console.log('[moveAttackBoard] Calling updateGameState...');
    get().updateGameState();

    console.log('[moveAttackBoard] Checking for forced promotions...');
    get().checkForcedPromotions();

    console.log('[moveAttackBoard] END');
  },

  canRotate: (boardId: string, angle: 0 | 180) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) return { allowed: false, reason: 'Unknown board' };
    if (angle === 0) return { allowed: true };

    const result = validateActivation({
      boardId,
      fromPinId,
      toPinId: fromPinId,
      rotate: true,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    return { allowed: result.isValid, reason: result.reason };
  },

  rotateAttackBoard: (boardId: string, angle: 0 | 180) => {
    const state = get();
    const pinId = state.attackBoardPositions[boardId];
    if (!pinId) return;

    if (angle === 0) {
      const track = boardId.endsWith('QL') ? 'QL' : 'KL';
      const pinNum = Number(pinId.slice(2));
      const newInstanceId = makeInstanceId(track as 'QL' | 'KL', pinNum, 0);

      const nextTrackStates = { ...(state.trackStates ?? { QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 }, KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 } }) };
      const isWhite = boardId.startsWith('W');
      const t = track as 'QL' | 'KL';
      if (isWhite) {
        nextTrackStates[t] = { ...nextTrackStates[t], whiteBoardPin: pinNum, whiteRotation: 0 };
      } else {
        nextTrackStates[t] = { ...nextTrackStates[t], blackBoardPin: pinNum, blackRotation: 0 };
      }

      updateInstanceVisibility(state.world, nextTrackStates);

      set({
        world: { ...state.world },  // Create new reference so Zustand detects the change
        attackBoardStates: {
          ...(get().attackBoardStates ?? {}),
          [boardId]: { activeInstanceId: newInstanceId },
        },
        trackStates: nextTrackStates,
        moveHistory: state.moveHistory,
      });
      return;
    }

    const validation = validateActivation({
      boardId,
      fromPinId: pinId,
      toPinId: pinId,
      rotate: true,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    if (!validation.isValid) return;

    const result = executeActivation({
      boardId,
      fromPinId: pinId,
      toPinId: pinId,
      rotate: true,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });

    const move: Move = {

      type: 'board-move',
      from: pinId,
      to: pinId,
      boardId,
      rotation: 180,
    };

    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    __snapshots.push(takeSnapshot(state));
    const parsed = parseInstanceId(result.activeInstanceId);
    const nextTrackStates = { ...(state.trackStates ?? { QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 }, KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0|180, blackRotation: 0 as 0|180 } }) };
    if (parsed) {
      const isWhite = boardId.startsWith('W');
      const t = parsed.track as 'QL' | 'KL';
      if (isWhite) {
        nextTrackStates[t] = { ...nextTrackStates[t], whiteBoardPin: parsed.pin, whiteRotation: parsed.rotation as 0|180 };
      } else {
        nextTrackStates[t] = { ...nextTrackStates[t], blackBoardPin: parsed.pin, blackRotation: parsed.rotation as 0|180 };
      }
    }

    updateInstanceVisibility(state.world, nextTrackStates);

    set({
      world: { ...state.world },  // Create new reference so Zustand detects the change
      pieces: result.updatedPieces,
      attackBoardPositions: result.updatedPositions,
      moveHistory: [...state.moveHistory, move],
      selectedBoardId: boardId,
      currentTurn: nextTurn,
      attackBoardStates: {
        ...(state.attackBoardStates ?? {}),
        [boardId]: {
          activeInstanceId: result.activeInstanceId,
        },
      },
      trackStates: nextTrackStates,
      attackBoardActivatedThisTurn: true, // Mark that attack board was activated
    });

    get().updateGameState();
    get().checkForcedPromotions();
  },
  importGameFromJson: async (json: string) => {
    const doc = await __persistence.importGame(json);
    hydrateFromPersisted(set, get, doc.payload);
  },

  getActiveInstance: (boardId: string) => {
    const state = get();
    const existing = state.attackBoardStates?.[boardId]?.activeInstanceId;
    if (existing) return existing;
    const pin = state.attackBoardPositions[boardId];
    const rotation = state.world.boards.get(boardId)?.rotation === 180 ? 180 : 0;
    const track = boardId.endsWith('QL') ? 'QL' : 'KL';
    const pinNum = Number(pin.slice(2));
    return makeInstanceId(track as 'QL' | 'KL', pinNum, rotation as 0 | 180);
  },

  setActiveInstance: (boardId: string, instanceId: string) => {
    const parsed = parseInstanceId(instanceId);
    if (!parsed) return;
    set((s) => ({
      attackBoardStates: {
        ...(s.attackBoardStates ?? {}),
        [boardId]: { activeInstanceId: instanceId },
      },
    }));
  },

  executeCastle: (castleType: CastleType) => {
    const state = get();
    const { currentTurn, pieces, world, trackStates, attackBoardActivatedThisTurn } = state;

    console.log(`[executeCastle] START - castleType: ${castleType}, currentTurn: ${currentTurn}`);

    const validation = validateCastle({
      color: currentTurn,
      castleType,
      pieces,
      world,
      trackStates: trackStates ?? {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      },
      currentTurn,
      attackBoardActivatedThisTurn,
    });

    console.log(`[executeCastle] Validation result:`, validation);

    if (!validation.valid) {
      console.error(`[executeCastle] Invalid castle: ${validation.reason}`);
      return;
    }

    const { kingFrom, kingTo, rookFrom, rookTo } = validation;
    if (!kingFrom || !kingTo || !rookFrom || !rookTo) {
      console.error('[executeCastle] Missing position data from validation');
      return;
    }

    const king = pieces.find(
      (p) => p.type === 'king' && p.color === currentTurn && 
             p.file === kingFrom.file && p.rank === kingFrom.rank && p.level === kingFrom.level
    );
    const rook = pieces.find(
      (p) => p.type === 'rook' && p.color === currentTurn && 
             p.file === rookFrom.file && p.rank === rookFrom.rank && p.level === rookFrom.level
    );

    if (!king || !rook) {
      console.error('[executeCastle] Could not find king or rook');
      return;
    }

    const updatedPieces = pieces.map((p) => {
      if (p.id === king.id) {
        return {
          ...p,
          file: kingTo.file,
          rank: kingTo.rank,
          level: kingTo.level,
          hasMoved: true,
        };
      }
      if (p.id === rook.id) {
        return {
          ...p,
          file: rookTo.file,
          rank: rookTo.rank,
          level: rookTo.level,
          hasMoved: true,
        };
      }
      return p;
    });

    const kingFromSquareId = createSquareId(kingFrom.file, kingFrom.rank, kingFrom.level);
    const kingToSquareId = createSquareId(kingTo.file, kingTo.rank, kingTo.level);
    const rookFromSquareId = createSquareId(rookFrom.file, rookFrom.rank, rookFrom.level);
    const rookToSquareId = createSquareId(rookTo.file, rookTo.rank, rookTo.level);

    const move: Move = {
      type: 'castle',
      castleType,
      color: currentTurn,
      kingFrom: kingFromSquareId,
      kingTo: kingToSquareId,
      rookFrom: rookFromSquareId,
      rookTo: rookToSquareId,
    };

    const nextTurn = currentTurn === 'white' ? 'black' : 'white';

    console.log(`[executeCastle] nextTurn calculated: ${nextTurn} (currentTurn was ${currentTurn})`);

    const checkStatus = isInCheck(nextTurn, world, updatedPieces, state.attackBoardStates, state.trackStates);
    const checkmateStatus = isCheckmate(nextTurn, world, updatedPieces, state.attackBoardStates, state.trackStates);
    const stalemateStatus = isStalemate(nextTurn, world, updatedPieces, state.attackBoardStates, state.trackStates);

    console.log(`[executeCastle] Game state checks - isCheck: ${checkStatus}, isCheckmate: ${checkmateStatus}, isStalemate: ${stalemateStatus}`);

    __snapshots.push(takeSnapshot(state));

    console.log(`[executeCastle] About to call set() with currentTurn: ${nextTurn}`);

    set({
      pieces: updatedPieces,
      moveHistory: [...state.moveHistory, move],
      currentTurn: nextTurn,
      selectedSquareId: null,
      highlightedSquareIds: [],
      castleDestinations: [],
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      gameOver: checkmateStatus || stalemateStatus,
      winner: checkmateStatus ? currentTurn : (stalemateStatus ? null : state.winner),
      attackBoardActivatedThisTurn: false, // Reset on turn change
    });

    console.log(`[executeCastle] set() completed. Verifying state...`);
    const newState = get();
    console.log(`[executeCastle] END - currentTurn is now: ${newState.currentTurn}, moveHistory length: ${newState.moveHistory.length}`);
  },

  // Promotion action implementations
  initiatePromotion: (pieceId: string, squareId: string, isForced: boolean, triggeredBy: 'move' | 'geometry') => {
    console.log(`[initiatePromotion] Initiating promotion for piece ${pieceId} at ${squareId}, isForced: ${isForced}, triggeredBy: ${triggeredBy}`);

    set({
      promotionPending: {
        pieceId,
        squareId,
        choices: ['queen', 'rook', 'bishop', 'knight'],
        isForced,
        triggeredBy,
      },
    });
  },

  executePromotion: (pieceType: 'queen' | 'rook' | 'bishop' | 'knight') => {
    const state = get();
    const pending = state.promotionPending;

    if (!pending) {
      console.warn('[executePromotion] No promotion pending');
      return;
    }

    console.log(`[executePromotion] Promoting piece ${pending.pieceId} to ${pieceType}`);

    // Update the piece to the new type and clear promotion state
    const updatedPieces = state.pieces.map((p) => {
      if (p.id === pending.pieceId) {
        return {
          ...p,
          type: pieceType,
          promotionState: undefined,
        };
      }
      return p;
    });

    // Remove from deferred promotions if present
    const updatedDeferredPromotions = state.deferredPromotions.filter(
      (d) => d.pieceId !== pending.pieceId
    );

    set({
      pieces: updatedPieces,
      promotionPending: undefined,
      deferredPromotions: updatedDeferredPromotions,
    });

    // If this was a move-triggered promotion, change turns now
    if (pending.triggeredBy === 'move') {
      const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

      const checkStatus = isInCheck(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);
      const checkmateStatus = isCheckmate(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);
      const stalemateStatus = isStalemate(nextTurn, state.world, updatedPieces, state.attackBoardStates, state.trackStates);

      set({
        currentTurn: nextTurn,
        isCheck: checkStatus,
        isCheckmate: checkmateStatus,
        isStalemate: stalemateStatus,
        gameOver: checkmateStatus || stalemateStatus,
        winner: checkmateStatus ? state.currentTurn : (stalemateStatus ? null : state.winner),
        attackBoardActivatedThisTurn: false,
      });
    } else {
      // Geometry-triggered: turn already changed, just update game state
      get().updateGameState();
    }
  },

  checkForcedPromotions: () => {
    const state = get();

    if (!state.trackStates) {
      console.warn('[checkForcedPromotions] No trackStates available');
      return;
    }

    console.log('[checkForcedPromotions] Checking for forced promotions...');

    // Import the function dynamically to avoid circular dependencies
    import('../engine/validation/promotionRules').then(({ detectForcedPromotions }) => {
      const forced = detectForcedPromotions(
        state.pieces,
        state.trackStates!,
        state.world,
        state.attackBoardStates
      );

      console.log(`[checkForcedPromotions] Found ${forced.length} forced promotions:`, forced);

      if (forced.length > 0) {
        // Trigger first forced promotion
        get().initiatePromotion(forced[0].pieceId, forced[0].squareId, true, 'geometry');
      }
    });
  },
}));

export function buildPersistablePayload(state: GameState) {
  const boardRotations: Record<string, number> = {};
  Array.from(state.world.boards.keys()).forEach((id) => {
    boardRotations[id] = state.world.boards.get(id)?.rotation ?? 0;
  });
  return {
    pieces: state.pieces,
    currentTurn: state.currentTurn,
    isCheck: state.isCheck,
    isCheckmate: state.isCheckmate,
    isStalemate: state.isStalemate,
    winner: state.winner,
    gameOver: state.gameOver,
    attackBoardPositions: state.attackBoardPositions,
    attackBoardStates: state.attackBoardStates,
    moveHistory: state.moveHistory,
    boardRotations,
  };
}

export function hydrateFromPersisted(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  payload: {
    pieces: Piece[];
    currentTurn: 'white' | 'black';
    isCheck?: boolean;
    isCheckmate?: boolean;
    isStalemate?: boolean;
    winner?: 'white' | 'black' | null;
    gameOver?: boolean;
    attackBoardPositions?: Record<string, string>;
    attackBoardStates?: Record<string, { activeInstanceId: string }>;
    moveHistory?: Move[];
    boardRotations?: Record<string, number>;
  }
) {
  const pieces = payload.pieces ?? [];
  const currentTurn = payload.currentTurn ?? 'white';
  const isCheck = payload.isCheck ?? false;
  const isCheckmate = payload.isCheckmate ?? false;
  const isStalemate = payload.isStalemate ?? false;
  const winner = payload.winner ?? null;
  const gameOver = payload.gameOver ?? false;
  const attackBoardPositions = payload.attackBoardPositions ?? getInitialPinPositions();
  const moveHistory = payload.moveHistory ?? [];
  const boardRotations = payload.boardRotations ?? {};

  set({
    pieces,
    currentTurn,
    isCheck,
    isCheckmate,
    isStalemate,
    winner,
    gameOver,
    attackBoardPositions,
    moveHistory,
    selectedSquareId: null,
    highlightedSquareIds: [],
    castleDestinations: [],
    selectedBoardId: null,
  });

  const state = get();

  const pinNum = (id: string | undefined) => Number((id ?? '').slice(2)) || 1;
  const rot = (boardId: string) => ((boardRotations[boardId] ?? 0) === 180 ? 180 : 0) as 0 | 180;
  const derivedTrackStates = {
    QL: { whiteBoardPin: pinNum(attackBoardPositions['WQL']), blackBoardPin: pinNum(attackBoardPositions['BQL']), whiteRotation: rot('WQL'), blackRotation: rot('BQL') },
    KL: { whiteBoardPin: pinNum(attackBoardPositions['WKL']), blackBoardPin: pinNum(attackBoardPositions['BKL']), whiteRotation: rot('WKL'), blackRotation: rot('BKL') },
  };

  set({ trackStates: derivedTrackStates });
  updateInstanceVisibility(state.world, derivedTrackStates);

  state.updateGameState();
}
