import { PieceType } from './types';

/**
 * Represents a piece in the game.
 */
export interface Piece {
  id: string;
  type: PieceType;
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string; // Board ID
  hasMoved: boolean;
  movedAsPassenger?: boolean;
}

/**
 * Creates the initial piece configuration for a new game.
 * Based on Meder rules and Table 1 from move_logic_tests.md
 */
export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 0;

  const createPiece = (
    type: PieceType,
    color: 'white' | 'black',
    file: number,
    rank: number,
    level: string
  ): Piece => ({
    id: `${color}-${type}-${idCounter++}`,
    type,
    color,
    file,
    rank,
    level,
    hasMoved: false,
  });

  // White Main Board (W) - Based on move_logic_tests.md Table 1
  // Rank 1: King and Queen
  pieces.push(createPiece('king', 'white', 2, 1, 'W'));   // b1W
  pieces.push(createPiece('queen', 'white', 3, 1, 'W'));  // c1W

  // Rank 2: Bishops and Knights
  pieces.push(createPiece('bishop', 'white', 1, 2, 'W')); // a2W
  pieces.push(createPiece('knight', 'white', 2, 2, 'W')); // b2W
  pieces.push(createPiece('knight', 'white', 3, 2, 'W')); // c2W
  pieces.push(createPiece('bishop', 'white', 4, 2, 'W')); // d2W

  // Rank 3: Pawns
  pieces.push(createPiece('pawn', 'white', 2, 3, 'W'));   // b3W
  pieces.push(createPiece('pawn', 'white', 3, 3, 'W'));   // c3W

  // Black Main Board (B) - Based on move_logic_tests.md Table 1
  // Rank 6: Pawns
  pieces.push(createPiece('pawn', 'black', 2, 6, 'B'));   // b6B
  pieces.push(createPiece('pawn', 'black', 3, 6, 'B'));   // c6B

  // Rank 7: Bishops and Knights
  pieces.push(createPiece('bishop', 'black', 1, 7, 'B')); // a7B
  pieces.push(createPiece('knight', 'black', 2, 7, 'B')); // b7B
  pieces.push(createPiece('knight', 'black', 3, 7, 'B')); // c7B
  pieces.push(createPiece('bishop', 'black', 4, 7, 'B')); // d7B

  // Rank 8: King and Queen
  pieces.push(createPiece('queen', 'black', 2, 8, 'B'));  // b8B
  pieces.push(createPiece('king', 'black', 3, 8, 'B'));   // c8B

  // White Queen-side Attack Board (WQL) - Based on move_logic_tests.md Table 1
  pieces.push(createPiece('rook', 'white', 0, 0, 'WQL')); // z0WQL
  pieces.push(createPiece('pawn', 'white', 0, 1, 'WQL')); // z1WQL
  pieces.push(createPiece('pawn', 'white', 1, 1, 'WQL')); // a1WQL

  // White King-side Attack Board (WKL) - Based on move_logic_tests.md Table 1
  // WKL board at KL1 covers files 4-5 (d-e), ranks 0-1
  pieces.push(createPiece('rook', 'white', 5, 0, 'WKL')); // e0WKL
  pieces.push(createPiece('pawn', 'white', 4, 1, 'WKL')); // d1WKL
  pieces.push(createPiece('pawn', 'white', 5, 1, 'WKL')); // e1WKL

  // Black Queen-side Attack Board (BQL) - Based on move_logic_tests.md Table 1
  // BQL board at QL6 covers files 0-1 (z-a), ranks 8-9
  pieces.push(createPiece('pawn', 'black', 0, 8, 'BQL')); // z8BQL
  pieces.push(createPiece('pawn', 'black', 1, 8, 'BQL')); // a8BQL
  pieces.push(createPiece('rook', 'black', 0, 9, 'BQL')); // z9BQL

  // Black King-side Attack Board (BKL) - Based on move_logic_tests.md Table 1
  // BKL board at KL6 covers files 4-5 (d-e), ranks 8-9
  pieces.push(createPiece('pawn', 'black', 4, 8, 'BKL')); // d8BKL
  pieces.push(createPiece('pawn', 'black', 5, 8, 'BKL')); // e8BKL
  pieces.push(createPiece('rook', 'black', 5, 9, 'BKL')); // e9BKL

  return pieces;
}
