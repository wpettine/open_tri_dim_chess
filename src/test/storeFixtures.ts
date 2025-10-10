import type { ChessWorld } from '../engine/world/types';
import type { Piece, GameState } from '../store/gameStore';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';
import { fileToWorldX, rankToWorldY } from '../engine/world/coordinates';

/**
 * Creates a minimal ChessWorld with just the 3 main boards for testing.
 * This is useful for tests that don't need attack boards.
 */
export function buildWorldMinimal(): ChessWorld {
  const world = createChessWorld();
  
  world.boards.forEach((board) => {
    if (board.type === 'attack') {
      board.isVisible = false;
      board.isAccessible = false;
    }
  });
  
  return world;
}

/**
 * Creates a full ChessWorld with default configuration (all 27 boards).
 * Attack boards are initially hidden as per the visibility-toggle system.
 */
export function buildWorldWithDefaults(): ChessWorld {
  return createChessWorld();
}

/**
 * Creates a minimal set of pieces for testing (2-4 pieces).
 * Useful for tests that need specific piece configurations without full setup.
 */
export function buildPiecesMinimal(): Piece[] {
  return [
    {
      id: 'white-pawn-test',
      type: 'pawn',
      color: 'white',
      file: 1, // file 'a'
      rank: 2,
      level: 'W',
      hasMoved: false,
    },
    {
      id: 'white-king-test',
      type: 'king',
      color: 'white',
      file: 4, // file 'd'
      rank: 0,
      level: 'WKL',
      hasMoved: false,
    },
    {
      id: 'black-pawn-test',
      type: 'pawn',
      color: 'black',
      file: 1, // file 'a'
      rank: 7,
      level: 'B',
      hasMoved: false,
    },
    {
      id: 'black-king-test',
      type: 'king',
      color: 'black',
      file: 4, // file 'd'
      rank: 9,
      level: 'BKL',
      hasMoved: false,
    },
  ];
}

/**
 * Creates a full set of initial pieces (all 32 pieces).
 */
export function buildPiecesDefault(): Piece[] {
  return createInitialPieces();
}

/**
 * Builds a complete game state for testing with customizable options.
 * Provides reasonable defaults for all required GameState properties.
 */
export function buildStoreState(options?: {
  world?: ChessWorld;
  pieces?: Piece[];
  currentTurn?: 'white' | 'black';
  selectedSquareId?: string | null;
  highlightedSquareIds?: string[];
  selectedBoardId?: string | null;
  trackStates?: {
    QL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
    KL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
  };
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  winner?: 'white' | 'black' | null;
  gameOver?: boolean;
}): Partial<GameState> {
  const world = options?.world ?? buildWorldWithDefaults();
  const pieces = options?.pieces ?? buildPiecesDefault();
  
  return {
    world,
    pieces,
    currentTurn: options?.currentTurn ?? 'white',
    selectedSquareId: options?.selectedSquareId ?? null,
    highlightedSquareIds: options?.highlightedSquareIds ?? [],
    selectedBoardId: options?.selectedBoardId ?? null,
    isCheck: options?.isCheck ?? false,
    isCheckmate: options?.isCheckmate ?? false,
    isStalemate: options?.isStalemate ?? false,
    winner: options?.winner ?? null,
    gameOver: options?.gameOver ?? false,
    attackBoardPositions: {
      WQL: 'QL1',
      WKL: 'KL1',
      BQL: 'QL6',
      BKL: 'KL6',
    },
    attackBoardStates: {
      WQL: { activeInstanceId: 'QL1:0' },
      WKL: { activeInstanceId: 'KL1:0' },
      BQL: { activeInstanceId: 'QL6:0' },
      BKL: { activeInstanceId: 'KL6:0' },
    },
    trackStates: options?.trackStates ?? {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    },
    moveHistory: [],
  };
}

/**
 * Creates a custom world with specific boards visible for testing visibility logic.
 */
export function buildWorldWithVisibleBoards(
  visibleInstanceIds: string[]
): ChessWorld {
  const world = createChessWorld();
  
  world.boards.forEach((board) => {
    if (board.type === 'attack') {
      board.isVisible = false;
      board.isAccessible = false;
    }
  });
  
  visibleInstanceIds.forEach((instanceId) => {
    const board = world.boards.get(instanceId);
    if (board && board.type === 'attack') {
      board.isVisible = true;
      board.isAccessible = true;
    }
  });
  
  return world;
}

/**
 * Helper to create a single test piece with custom properties.
 */
export function createTestPiece(
  type: Piece['type'],
  color: Piece['color'],
  file: number,
  rank: number,
  level: string,
  extras?: Partial<Piece>
): Piece {
  return {
    id: `${color}-${type}-test-${file}-${rank}-${level}`,
    type,
    color,
    file,
    rank,
    level,
    hasMoved: false,
    ...extras,
  };
}

/**
 * Helper to get expected world coordinates for a square.
 * Uses the same coordinate functions as the world builder.
 */
export function getExpectedSquareCoords(
  file: number,
  rank: number,
  zHeight: number
): { worldX: number; worldY: number; worldZ: number } {
  return {
    worldX: fileToWorldX(file),
    worldY: rankToWorldY(rank),
    worldZ: zHeight,
  };
}
