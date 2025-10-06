export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Color = 'white' | 'black';

export interface Move {
  from: string; // Square ID
  to: string;   // Square ID
  piece: PieceType;
  color: Color;
  captured?: PieceType;
  boardMoved?: string; // Attack board ID if board moved
  timestamp: number;
}
