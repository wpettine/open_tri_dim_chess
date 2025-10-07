export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Color = 'white' | 'black';

export interface Move {
  from: string;
  to: string;
  piece: PieceType;
  color: Color;
  captured?: PieceType;
  boardMoved?: string;
  timestamp: number;
}
