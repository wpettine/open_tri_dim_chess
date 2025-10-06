import type { Piece } from '../store/gameStore';

export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  let id = 0;

  pieces.push({ id: `p${id++}`, type: 'king', color: 'white', file: 2, rank: 1, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'queen', color: 'white', file: 3, rank: 1, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'bishop', color: 'white', file: 1, rank: 2, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'bishop', color: 'white', file: 4, rank: 2, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'knight', color: 'white', file: 2, rank: 2, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'knight', color: 'white', file: 3, rank: 2, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 1, rank: 3, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 2, rank: 3, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 3, rank: 3, level: 'W', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 4, rank: 3, level: 'W', hasMoved: false });

  pieces.push({ id: `p${id++}`, type: 'rook', color: 'white', file: 0, rank: 0, level: 'WQL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 0, rank: 1, level: 'WQL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 1, rank: 1, level: 'WQL', hasMoved: false });

  pieces.push({ id: `p${id++}`, type: 'rook', color: 'white', file: 5, rank: 0, level: 'WKL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 4, rank: 1, level: 'WKL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'white', file: 5, rank: 1, level: 'WKL', hasMoved: false });

  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 1, rank: 6, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 2, rank: 6, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 3, rank: 6, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 4, rank: 6, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'bishop', color: 'black', file: 1, rank: 7, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'bishop', color: 'black', file: 4, rank: 7, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'knight', color: 'black', file: 2, rank: 7, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'knight', color: 'black', file: 3, rank: 7, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'queen', color: 'black', file: 2, rank: 8, level: 'B', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'king', color: 'black', file: 3, rank: 8, level: 'B', hasMoved: false });

  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 0, rank: 8, level: 'BQL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 1, rank: 8, level: 'BQL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'rook', color: 'black', file: 0, rank: 9, level: 'BQL', hasMoved: false });

  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 4, rank: 8, level: 'BKL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'pawn', color: 'black', file: 5, rank: 8, level: 'BKL', hasMoved: false });
  pieces.push({ id: `p${id++}`, type: 'rook', color: 'black', file: 5, rank: 9, level: 'BKL', hasMoved: false });

  return pieces;
}
