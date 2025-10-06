export const SQUARE_SIZE = 2.0;
export const SQUARE_GAP = 0.1;
export const BOARD_SPACING = SQUARE_SIZE + SQUARE_GAP;

export const FILE_LETTERS = ['z', 'a', 'b', 'c', 'd', 'e'];

export function fileToWorldX(file: number): number {
  return file * BOARD_SPACING;
}

export function rankToWorldY(rank: number): number {
  return rank * BOARD_SPACING;
}

export function fileToString(file: number): string {
  return FILE_LETTERS[file];
}

export function stringToFile(fileStr: string): number {
  const index = FILE_LETTERS.indexOf(fileStr);
  if (index === -1) {
    throw new Error(`Invalid file letter: ${fileStr}`);
  }
  return index;
}

export function createSquareId(file: number, rank: number, boardId: string): string {
  return `${fileToString(file)}${rank}${boardId}`;
}

export function parseSquareId(squareId: string): { file: number; rank: number; boardId: string } | null {
  const match = squareId.match(/^([a-ez])(\d+)(.+)$/);
  if (!match) return null;
  
  const [, fileStr, rankStr, boardId] = match;
  return {
    file: stringToFile(fileStr),
    rank: parseInt(rankStr, 10),
    boardId,
  };
}
