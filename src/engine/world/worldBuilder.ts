import type { ChessWorld, BoardLayout, WorldSquare } from './types';
import { PIN_POSITIONS, getInitialPinPositions, Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN } from './pinPositions';
import { fileToWorldX, rankToWorldY, createSquareId } from './coordinates';

export function createChessWorld(): ChessWorld {
  const boards = new Map<string, BoardLayout>();
  const squares = new Map<string, WorldSquare>();
  const pins = new Map(Object.entries(PIN_POSITIONS));

  const mainWhite = createMainBoard('W', 'W', [1, 2, 3, 4], [1, 2, 3, 4], Z_WHITE_MAIN);
  const mainNeutral = createMainBoard('N', 'N', [1, 2, 3, 4], [3, 4, 5, 6], Z_NEUTRAL_MAIN);
  const mainBlack = createMainBoard('B', 'B', [1, 2, 3, 4], [5, 6, 7, 8], Z_BLACK_MAIN);

  boards.set('W', mainWhite.board);
  boards.set('N', mainNeutral.board);
  boards.set('B', mainBlack.board);

  mainWhite.squares.forEach((sq) => squares.set(sq.id, sq));
  mainNeutral.squares.forEach((sq) => squares.set(sq.id, sq));
  mainBlack.squares.forEach((sq) => squares.set(sq.id, sq));

  const initialPins = getInitialPinPositions();
  
  const allPins = ['QL1', 'QL2', 'QL3', 'QL4', 'QL5', 'QL6', 'KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'];
  
  const attackBoardConfigs = [
    { baseId: 'WQL', initialPin: initialPins.WQL },
    { baseId: 'WKL', initialPin: initialPins.WKL },
    { baseId: 'BQL', initialPin: initialPins.BQL },
    { baseId: 'BKL', initialPin: initialPins.BKL },
  ];

  for (const config of attackBoardConfigs) {
    for (const pinId of allPins) {
      for (const rotation of [0, 180] as const) {
        const isInitialPosition = pinId === config.initialPin && rotation === 0;
        const instanceId = rotation === 0 ? `${config.baseId}_${pinId}` : `${config.baseId}_${pinId}_R180`;
        
        const instance = createAttackBoardInstance(
          instanceId,
          config.baseId,
          pinId,
          rotation,
          isInitialPosition
        );
        
        boards.set(instanceId, instance.board);
        instance.squares.forEach((sq) => squares.set(sq.id, sq));
      }
    }
  }

  return { boards, squares, pins };
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
    visible: true,
    accessible: true,
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
  instanceId: string,
  baseId: string,
  pinId: string,
  rotation: 0 | 180,
  isVisible: boolean
): { board: BoardLayout; squares: WorldSquare[] } {
  const pin = PIN_POSITIONS[pinId];
  if (!pin) {
    throw new Error(`Invalid pin ID: ${pinId}`);
  }

  const isQueenLine = pinId.startsWith('QL');
  const baseFile = isQueenLine ? 0 : 4;
  
  let files = [baseFile, baseFile + 1];
  let ranks = [pin.rankOffset, pin.rankOffset + 1];
  
  if (rotation === 180) {
    files = [baseFile + 1, baseFile];
    ranks = [pin.rankOffset + 1, pin.rankOffset];
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
    id: instanceId,
    type: 'attack',
    centerX,
    centerY,
    centerZ,
    size: { width, height },
    rotation,
    files,
    ranks,
    visible: isVisible,
    accessible: isVisible,
    pinId: pinId,
    rotationState: rotation,
  };

  const squares: WorldSquare[] = [];
  for (const file of files) {
    for (const rank of ranks) {
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = pin.zHeight;
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
