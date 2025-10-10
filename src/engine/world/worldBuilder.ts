import type { ChessWorld, BoardLayout, WorldSquare, PinAdjacencyGraph } from './types';
import { PIN_POSITIONS, getInitialPinPositions, Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN } from './pinPositions';
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

  const initialPins = getInitialPinPositions();
  
  const wql = createAttackBoard('WQL', initialPins.WQL, [0, 1], [0, 1]);
  const wkl = createAttackBoard('WKL', initialPins.WKL, [4, 5], [0, 1]);
  const bql = createAttackBoard('BQL', initialPins.BQL, [0, 1], [8, 9]);
  const bkl = createAttackBoard('BKL', initialPins.BKL, [4, 5], [8, 9]);

  boards.set('WQL', wql.board);
  boards.set('WKL', wkl.board);
  boards.set('BQL', bql.board);
  boards.set('BKL', bkl.board);

  wql.squares.forEach((sq) => squares.set(sq.id, sq));
  wkl.squares.forEach((sq) => squares.set(sq.id, sq));
  bql.squares.forEach((sq) => squares.set(sq.id, sq));
  bkl.squares.forEach((sq) => squares.set(sq.id, sq));

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

function createAttackBoard(
  id: string,
  pinId: string,
  files: number[],
  ranks: number[]
): { board: BoardLayout; squares: WorldSquare[] } {
  const pin = PIN_POSITIONS[pinId];
  if (!pin) {
    throw new Error(`Invalid pin ID: ${pinId}`);
  }

  const minFile = Math.min(...files);
  const maxFile = Math.max(...files);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  const centerX = (fileToWorldX(minFile) + fileToWorldX(maxFile)) / 2;
  const centerY = (rankToWorldY(minRank) + rankToWorldY(maxRank)) / 2;
  const centerZ = pin.zHeight;

  const width = maxFile - minFile + 1;
  const height = maxRank - minRank + 1;

  const board: BoardLayout = {
    id,
    type: 'attack',
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
      const worldZ = pin.zHeight;
      const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
      const squareId = createSquareId(file, rank, id);

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
