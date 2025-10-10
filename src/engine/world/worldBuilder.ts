import type { ChessWorld, BoardLayout, WorldSquare, PinAdjacencyGraph } from './types';
import { PIN_POSITIONS, Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN } from './pinPositions';
import { fileToWorldX, rankToWorldY, createSquareId } from './coordinates';
import { PIN_ADJACENCY } from './attackBoardAdjacency';

export function createChessWorld(): ChessWorld {
  const boards = new Map<string, BoardLayout>();
  const squares = new Map<string, WorldSquare>();
  const pins = new Map(Object.entries(PIN_POSITIONS));
  const adjacencyGraph = PIN_ADJACENCY as unknown as PinAdjacencyGraph;

  const mainWhite = createMainBoard('WL', 'W', [1, 2, 3, 4], [1, 2, 3, 4], Z_WHITE_MAIN);
  const mainNeutral = createMainBoard('NL', 'N', [1, 2, 3, 4], [3, 4, 5, 6], Z_NEUTRAL_MAIN);
  const mainBlack = createMainBoard('BL', 'B', [1, 2, 3, 4], [5, 6, 7, 8], Z_BLACK_MAIN);

  boards.set('WL', mainWhite.board);
  boards.set('NL', mainNeutral.board);
  boards.set('BL', mainBlack.board);

  mainWhite.squares.forEach((sq) => squares.set(sq.id, sq));
  mainNeutral.squares.forEach((sq) => squares.set(sq.id, sq));
  mainBlack.squares.forEach((sq) => squares.set(sq.id, sq));

  const tracks = ['QL', 'KL'] as const;
  const rotations = [0, 180] as const;
  
  for (const track of tracks) {
    for (let pin = 1; pin <= 6; pin++) {
      for (const rotation of rotations) {
        const instance = createAttackBoardInstance(track, pin, rotation);
        boards.set(instance.board.id, instance.board);
        instance.squares.forEach((sq) => squares.set(sq.id, sq));
      }
    }
  }

  return { boards, squares, pins, adjacencyGraph };
}

function createMainBoard(
  id: string,
  shortId: string,
  files: number[],
  ranks: number[],
  zHeight: number
): { board: BoardLayout; squares: WorldSquare[] } {
  const minFile = Math.min(...files);
  const maxFile = Math.max(...files);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  const centerX = (fileToWorldX(minFile) + fileToWorldX(maxFile)) / 2;
  const centerY = (rankToWorldY(minRank) + rankToWorldY(maxRank)) / 2;
  const centerZ = zHeight;

  const width = maxFile - minFile + 1;
  const height = maxRank - minRank + 1;

  const board: BoardLayout = {
    id,
    type: 'main',
    centerX,
    centerY,
    centerZ,
    size: { width, height },
    rotation: 0,
    files,
    ranks,
  };

  const squares: WorldSquare[] = [];
  for (const file of files) {
    for (const rank of ranks) {
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = zHeight;
      const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
      const squareId = createSquareId(file, rank, shortId);

      squares.push({
        id: squareId,
        boardId: id,
        file,
        rank,
        worldX,
        worldY,
        worldZ,
        color,
      });
    }
  }

  return { board, squares };
}

function createAttackBoardInstance(
  track: 'QL' | 'KL',
  pin: number,
  rotation: 0 | 180
): { board: BoardLayout; squares: WorldSquare[] } {
  const instanceId = `${track}${pin}:${rotation}`;
  const pinId = `${track}${pin}`;
  const pinPosition = PIN_POSITIONS[pinId];
  
  if (!pinPosition) {
    throw new Error(`Invalid pin ID: ${pinId}`);
  }

  const baseFile = track === 'QL' ? 0 : 4;
  const rankOffset = pinPosition.rankOffset;
  
  let files: number[];
  let ranks: number[];
  
  if (rotation === 0) {
    files = [baseFile, baseFile + 1];
    ranks = [rankOffset, rankOffset + 1];
  } else {
    files = [baseFile + 1, baseFile];
    ranks = [rankOffset + 1, rankOffset];
  }

  const minFile = Math.min(...files);
  const maxFile = Math.max(...files);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  const centerX = (fileToWorldX(minFile) + fileToWorldX(maxFile)) / 2;
  const centerY = (rankToWorldY(minRank) + rankToWorldY(maxRank)) / 2;
  const centerZ = pinPosition.zHeight;

  const board: BoardLayout = {
    id: instanceId,
    type: 'attack',
    centerX,
    centerY,
    centerZ,
    size: { width: 2, height: 2 },
    rotation,
    files,
    ranks,
    track,
    pin,
    isVisible: false,
    isAccessible: false,
  };

  const squares: WorldSquare[] = [];
  for (const file of files) {
    for (const rank of ranks) {
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = pinPosition.zHeight;
      const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
      const squareId = createSquareId(file, rank, instanceId);

      squares.push({
        id: squareId,
        boardId: instanceId,
        file,
        rank,
        worldX,
        worldY,
        worldZ,
        color,
      });
    }
  }

  return { board, squares };
}
