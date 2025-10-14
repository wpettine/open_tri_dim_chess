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
import { updateInstanceVisibility } from '../engine/world/visibility';
import { validateActivation, executeActivation } from '../engine/world/worldMutation';
import { getArrivalOptions } from '../engine/world/coordinatesTransform';
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
  };
}

function restoreSnapshot(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  snap: GameSnapshot
) {
  set({
    pieces: snap.pieces,
    currentTurn: snap.currentTurn,
    isCheck: snap.isCheck,
    isCheckmate: snap.isCheckmate,
    isStalemate: snap.isStalemate,
    winner: snap.winner,
    gameOver: snap.gameOver,
    attackBoardPositions: snap.attackBoardPositions,
    moveHistory: snap.moveHistory,
    selectedSquareId: null,
    highlightedSquareIds: [],
    selectedBoardId: null,
  });
  const state = get();
  
  const pinNum = (id: string | undefined) => Number((id ?? '').slice(2)) || 1;
  const rot = (boardId: string) => ((snap.boardRotations[boardId] ?? 0) === 180 ? 180 : 0) as 0 | 180;
  const derivedTrackStates = {
    QL: { whiteBoardPin: pinNum(snap.attackBoardPositions['WQL']), blackBoardPin: pinNum(snap.attackBoardPositions['BQL']), whiteRotation: rot('WQL'), blackRotation: rot('BQL') },
    KL: { whiteBoardPin: pinNum(snap.attackBoardPositions['WKL']), blackBoardPin: pinNum(snap.attackBoardPositions['BKL']), whiteRotation: rot('WKL'), blackRotation: rot('BKL') },
  };
  
  set({ trackStates: derivedTrackStates });
  updateInstanceVisibility(state.world, derivedTrackStates);

  state.updateGameState();
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
    };

export interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  selectedSquareId: string | null;
  highlightedSquareIds: string[];
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
}
const __persistence = new LocalStoragePersistence();


function boardIdToLevel(boardId: string): string {
  if (boardId === 'WL') return 'W';
  if (boardId === 'NL') return 'N';
  if (boardId === 'BL') return 'B';
  return boardId;
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
        const pieceSquareId = createSquareId(p.file, p.rank, p.level);
        return pieceSquareId === squareId;
      });
      
      if (piece && piece.color === state.currentTurn) {
        const validMoves = get().getValidMovesForSquare(squareId);
        set({ 
          selectedSquareId: squareId,
          highlightedSquareIds: validMoves,
          selectedBoardId: null,
        });
      }
    } else {
      if (state.highlightedSquareIds.includes(squareId)) {
        const selectedPiece = state.pieces.find((p) => {
          const pieceSquareId = createSquareId(p.file, p.rank, p.level);
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
          const pieceSquareId = createSquareId(p.file, p.rank, p.level);
          return pieceSquareId === squareId;
        });
        
        if (piece && piece.color === state.currentTurn) {
          const validMoves = get().getValidMovesForSquare(squareId);
          set({ 
            selectedSquareId: squareId,
            highlightedSquareIds: validMoves,
            selectedBoardId: null,
          });
        } else {
          set({ selectedSquareId: null, highlightedSquareIds: [] });
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
    const move: Move = {
      type: 'piece-move',
      from: fromSquare?.id || '',
      to: toSquare?.id || '',
      piece: { type: piece.type, color: piece.color },
    };
    
    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    const checkStatus = isInCheck(nextTurn, state.world, updatedPieces, state.attackBoardStates);
    const checkmateStatus = isCheckmate(nextTurn, state.world, updatedPieces, state.attackBoardStates);
    const stalemateStatus = isStalemate(nextTurn, state.world, updatedPieces, state.attackBoardStates);
    
    __snapshots.push(takeSnapshot(state));
    set({
      pieces: updatedPieces,
      moveHistory: [...state.moveHistory, move],
      currentTurn: nextTurn,
      selectedSquareId: null,
      highlightedSquareIds: [],
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      gameOver: checkmateStatus || stalemateStatus,
      winner: checkmateStatus ? state.currentTurn : (stalemateStatus ? null : state.winner),
    });
  },

  undoMove: () => {
    if (__snapshots.length === 0) return;
    const snap = __snapshots.pop()!;
    restoreSnapshot(set, get, snap);
  },
  
  clearSelection: () => {
    set({ selectedSquareId: null, highlightedSquareIds: [], selectedBoardId: null });
  },

  selectBoard: (boardId: string | null) => {
    if (boardId === null) {
      set({ selectedBoardId: null });
    } else {
      set({ 
        selectedBoardId: boardId,
        selectedSquareId: null,
        highlightedSquareIds: []
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
    });
  },

  getValidMovesForSquare: (squareId: string) => {
    const state = get();
    
    const piece = state.pieces.find((p) => {
      const pieceSquareId = createSquareId(p.file, p.rank, p.level);
      return pieceSquareId === squareId;
    });

    if (!piece || piece.color !== state.currentTurn) {
      return [];
    }

    return getLegalMovesAvoidingCheck(piece, state.world, state.pieces, state.attackBoardStates);
  },

  updateGameState: () => {
    const state = get();
    const currentPlayer = state.currentTurn;

    const checkStatus = isInCheck(currentPlayer, state.world, state.pieces, state.attackBoardStates);
    const checkmateStatus = isCheckmate(currentPlayer, state.world, state.pieces, state.attackBoardStates);
    const stalemateStatus = isStalemate(currentPlayer, state.world, state.pieces, state.attackBoardStates);

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

    console.log('[moveAttackBoard] BEFORE:', {
      boardId,
      fromPinId,
      toPinId,
      rotate,
      currentTurn: state.currentTurn,
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

    const kingPieceBefore = state.pieces.find(p => p.type === 'king' && p.level === boardId);
    const kingPieceAfter = result.updatedPieces.find(p => p.type === 'king' && p.level === boardId);
    console.log('[moveAttackBoard] King before/after:', {
      before: kingPieceBefore ? { file: kingPieceBefore.file, rank: kingPieceBefore.rank, level: kingPieceBefore.level } : 'not found',
      after: kingPieceAfter ? { file: kingPieceAfter.file, rank: kingPieceAfter.rank, level: kingPieceAfter.level } : 'not found',
    });

    const move: Move = {
      type: 'board-move',
      from: fromPinId,
      to: toPinId,
      boardId,
      rotation: rotate ? 180 : undefined,
    };

    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    console.log('[moveAttackBoard] AFTER:', {
      nextTurn,
      moveHistoryLength: state.moveHistory.length + 1,
    });

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

    set({
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
    });

    updateInstanceVisibility(state.world, nextTrackStates);
    get().updateGameState();
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

      set({
        attackBoardStates: {
          ...(get().attackBoardStates ?? {}),
          [boardId]: { activeInstanceId: newInstanceId },
        },
        trackStates: nextTrackStates,
        moveHistory: state.moveHistory,
      });

      updateInstanceVisibility(state.world, nextTrackStates);
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

    set({
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
    });

    updateInstanceVisibility(state.world, nextTrackStates);
    get().updateGameState();
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
