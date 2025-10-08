import { LocalStoragePersistence } from '../persistence/localStoragePersistence';
import { SCHEMA_VERSION } from '../persistence/schema';

import { create } from 'zustand';
import type { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';
import { getLegalMovesAvoidingCheck, isInCheck, isCheckmate, isStalemate } from '../engine/validation/checkDetection';
import { createSquareId } from '../engine/world/coordinates';
import { getInitialPinPositions } from '../engine/world/pinPositions';
import { PIN_POSITIONS } from '../engine/world/pinPositions';
import { validateBoardMove, executeBoardMove } from '../engine/world/worldMutation';
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
  Object.entries(state.attackBoardPositions).forEach(([boardId, pinId]) => {
    const rotation = snap.boardRotations[boardId] ?? 0;
    updateAttackBoardWorld(state.world, boardId, pinId, rotation);
  });
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
  selectedBoardId: string | null;
  moveHistory: Move[];
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
  moveAttackBoard: (boardId: string, toPinId: string, rotate?: boolean) => void;
  canRotate: (boardId: string, angle: 0 | 180) => { allowed: boolean; reason?: string };
  rotateAttackBoard: (boardId: string, angle: 0 | 180) => void;
  undoMove: () => void;
}
const __persistence = new LocalStoragePersistence();


function boardIdToLevel(boardId: string): string {
  if (boardId === 'WL') return 'W';
  if (boardId === 'NL') return 'N';
  if (boardId === 'BL') return 'B';
  return boardId;
}

export const useGameStore = create<GameState>()((set, get) => ({
  world: createChessWorld(),
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
  selectedBoardId: null,
  moveHistory: [],
  
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
    
    const checkStatus = isInCheck(nextTurn, state.world, updatedPieces);
    const checkmateStatus = isCheckmate(nextTurn, state.world, updatedPieces);
    const stalemateStatus = isStalemate(nextTurn, state.world, updatedPieces);
    
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
    set({
      world: createChessWorld(),
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

    return getLegalMovesAvoidingCheck(piece, state.world, state.pieces);
  },

  updateGameState: () => {
    const state = get();
    const currentPlayer = state.currentTurn;

    const checkStatus = isInCheck(currentPlayer, state.world, state.pieces);
    const checkmateStatus = isCheckmate(currentPlayer, state.world, state.pieces);
    const stalemateStatus = isStalemate(currentPlayer, state.world, state.pieces);

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
    const result = validateBoardMove({
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

  moveAttackBoard: (boardId: string, toPinId: string, rotate = false) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) return;

    const validation = validateBoardMove({
      boardId,
      fromPinId,
      toPinId,
      rotate,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    if (!validation.isValid) return;

    const result = executeBoardMove({
      boardId,
      fromPinId,
      toPinId,
      rotate,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });

    updateAttackBoardWorld(state.world, boardId, toPinId, state.world.boards.get(boardId)?.rotation ?? 0);

    const move: Move = {
      type: 'board-move',
      from: fromPinId,
      to: toPinId,
      boardId,
      rotation: rotate ? 180 : undefined,
    };

    __snapshots.push(takeSnapshot(state));
    set({
      pieces: result.updatedPieces,
      attackBoardPositions: result.updatedPositions,
      moveHistory: [...state.moveHistory, move],
      selectedBoardId: boardId,
    });
  },

  canRotate: (boardId: string, angle: 0 | 180) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId];
    if (!fromPinId) return { allowed: false, reason: 'Unknown board' };
    if (angle === 0) return { allowed: true };

    const result = validateBoardMove({
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
      updateAttackBoardWorld(state.world, boardId, pinId, 0);
      set({
        moveHistory: state.moveHistory,
      });
      return;
    }

    const validation = validateBoardMove({
      boardId,
      fromPinId: pinId,
      toPinId: pinId,
      rotate: true,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });
    if (!validation.isValid) return;

    const result = executeBoardMove({
      boardId,
      fromPinId: pinId,
      toPinId: pinId,
      rotate: true,
      pieces: state.pieces,
      world: state.world,
      attackBoardPositions: state.attackBoardPositions,
    });

    updateAttackBoardWorld(state.world, boardId, pinId, 180);

    const move: Move = {
      type: 'board-move',
      from: pinId,
      to: pinId,
      boardId,
      rotation: 180,
    };

    __snapshots.push(takeSnapshot(state));
    set({
      pieces: result.updatedPieces,
      attackBoardPositions: result.updatedPositions,
      moveHistory: [...state.moveHistory, move],
      selectedBoardId: boardId,
    });
  },
  importGameFromJson: async (json: string) => {
    const doc = await __persistence.importGame(json);
    hydrateFromPersisted(set, get, doc.payload);
  },
}));
export function buildPersistablePayload(state: GameState) {
  return {
    pieces: state.pieces,
    currentTurn: state.currentTurn,
    isCheck: state.isCheck,
    isCheckmate: state.isCheckmate,
    isStalemate: state.isStalemate,
    winner: state.winner,
    gameOver: state.gameOver,
    attackBoardPositions: state.attackBoardPositions,
    moveHistory: state.moveHistory,
  };
}

function updateAttackBoardWorld(
  world: ChessWorld,
  boardId: string,
  pinId: string,
  rotation: number
) {
  const board = world.boards.get(boardId);
  const pin = PIN_POSITIONS[pinId];
  if (!board || !pin) return;
  
  const Z_WHITE_MAIN = 0;
  const Z_NEUTRAL_MAIN = 5;
  const Z_BLACK_MAIN = 10;
  const ATTACK_OFFSET = 2.5;
  
  let mainBoardZ: number;
  if (pin.level <= 1) {
    mainBoardZ = Z_WHITE_MAIN;
  } else if (pin.level === 2) {
    mainBoardZ = Z_NEUTRAL_MAIN;
  } else {
    mainBoardZ = Z_BLACK_MAIN;
  }
  
  const attackBoardZ = mainBoardZ + ATTACK_OFFSET;
  
  board.centerZ = attackBoardZ;
  board.rotation = rotation;
  world.boards.set(boardId, board);
  Array.from(world.squares.values())
    .filter((sq) => sq.boardId === boardId)
    .forEach((sq) => {
      sq.worldZ = attackBoardZ;
      world.squares.set(sq.id, sq);
    });
}

export function hydrateFromPersisted(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  payload: ReturnType<typeof buildPersistablePayload>
) {
  set({
    pieces: payload.pieces,
    currentTurn: payload.currentTurn,
    isCheck: payload.isCheck,
    isCheckmate: payload.isCheckmate,
    isStalemate: payload.isStalemate,
    winner: payload.winner,
    gameOver: payload.gameOver,
    attackBoardPositions: payload.attackBoardPositions,
    moveHistory: payload.moveHistory,
    selectedSquareId: null,
    highlightedSquareIds: [],
    selectedBoardId: null,
  });
  get().updateGameState();
}
