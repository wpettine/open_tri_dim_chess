import { ChessWorld, WorldSquare } from './types';
import { PIN_POSITIONS, getInitialPinPositions } from './pinPositions';
import { fileToWorldX, rankToWorldY, createSquareId } from './coordinates';

/**
 * Creates the complete world grid with all boards and squares.
 *
 * This is called ONCE at game initialization. All positions are pre-computed
 * and stored in the world grid. Rendering components simply read these values.
 */
export function createChessWorld(): ChessWorld {
  const world: ChessWorld = {
    squares: new Map(),
    boards: new Map(),
    pins: new Map(),
  };

  // Load pin positions
  Object.entries(PIN_POSITIONS).forEach(([id, pin]) => {
    world.pins.set(id, pin);
  });

  // Create main boards (static positions)
  // Based on Meder rules: all 3 main boards are 4x4 (16 squares each)
  // Files a-d (1-4), overlapping in ranks

  createMainBoard(world, 'W', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [1, 2, 3, 4],    // White main board
    zHeight: 5,
  });

  createMainBoard(world, 'N', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [3, 4, 5, 6],    // Neutral board (overlaps with W at 3-4, B at 5-6)
    zHeight: 10,
  });

  createMainBoard(world, 'B', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [5, 6, 7, 8],    // Black main board (overlaps with N at 5-6)
    zHeight: 15,
  });

  // Create attack boards at initial pins
  const initialPins = getInitialPinPositions();
  createAttackBoard(world, 'WQL', initialPins.WQL);
  createAttackBoard(world, 'WKL', initialPins.WKL);
  createAttackBoard(world, 'BQL', initialPins.BQL);
  createAttackBoard(world, 'BKL', initialPins.BKL);

  return world;
}

/**
 * Creates a main board (4x4) with specified file/rank ranges.
 */
function createMainBoard(
  world: ChessWorld,
  boardId: string,
  config: { files: number[]; ranks: number[]; zHeight: number }
): void {
  const { files, ranks, zHeight } = config;

  // Create all squares for this board
  for (const file of files) {
    for (const rank of ranks) {
      const square: WorldSquare = {
        id: createSquareId(file, rank, boardId),
        boardId,
        file,
        rank,
        level: boardId,
        worldX: fileToWorldX(file),
        worldY: rankToWorldY(rank),
        worldZ: zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };
      world.squares.set(square.id, square);
    }
  }

  // Calculate board center from squares (don't hardcode!)
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[files.length - 1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[ranks.length - 1])) / 2;

  world.boards.set(boardId, {
    id: boardId,
    type: 'main',
    size: { width: files.length, height: ranks.length },
    centerX,
    centerY,
    centerZ: zHeight,
    rotation: 0,
    canMove: false,
  });
}

/**
 * Creates an attack board (2x2) at the specified pin.
 */
function createAttackBoard(world: ChessWorld, boardId: string, pinId: string): void {
  const pin = world.pins.get(pinId);
  if (!pin) {
    throw new Error(`Pin not found: ${pinId}`);
  }

  // Attack boards are 2x2
  const files = [pin.fileOffset, pin.fileOffset + 1];
  const ranks = [pin.rankOffset, pin.rankOffset + 1];

  // Create squares
  for (const file of files) {
    for (const rank of ranks) {
      const square: WorldSquare = {
        id: createSquareId(file, rank, boardId),
        boardId,
        file,
        rank,
        level: boardId,
        worldX: fileToWorldX(file),
        worldY: rankToWorldY(rank),
        worldZ: pin.zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };
      world.squares.set(square.id, square);
    }
  }

  // Calculate center
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[1])) / 2;

  world.boards.set(boardId, {
    id: boardId,
    type: 'attack',
    size: { width: 2, height: 2 },
    currentPin: pinId,
    centerX,
    centerY,
    centerZ: pin.zHeight,
    rotation: pin.inverted ? 180 : 0,
    canMove: true,
  });
}
