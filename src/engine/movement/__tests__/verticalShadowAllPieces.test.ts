import { describe, it, expect } from 'vitest';
import { isValidMove, PieceState } from '../index';
import { createChessWorld } from '../../world/worldBuilder';

describe('Vertical Shadow Blocking - All Pieces', () => {
  const world = createChessWorld();

  it('should block rook from moving to occupied file-rank on different level', () => {
    // Rook at a3W wants to move to b3W
    // Pawn at b3N blocks the destination
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'a3W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3N', hasMoved: false },
    ];

    const result = isValidMove('r1', 'a3W', 'b3W', pieces, world, 'white');
    expect(result.valid).toBe(false);
  });

  it('should block bishop from moving to occupied file-rank on different level', () => {
    // Bishop at a3W wants to move to c5N
    // Pawn at c5B blocks the destination
    const pieces: PieceState[] = [
      { id: 'b1', type: 'bishop', color: 'white', squareId: 'a3W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'c5B', hasMoved: false },
    ];

    const result = isValidMove('b1', 'a3W', 'c5N', pieces, world, 'white');
    expect(result.valid).toBe(false);
  });

  it('should block queen from moving to occupied file-rank on different level', () => {
    // Queen at a3N wants to move to a5N
    // Pawn at a5B blocks the destination
    const pieces: PieceState[] = [
      { id: 'q1', type: 'queen', color: 'white', squareId: 'a3N', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'a5B', hasMoved: false },
    ];

    const result = isValidMove('q1', 'a3N', 'a5N', pieces, world, 'white');
    expect(result.valid).toBe(false);
  });

  it('should block king from moving to occupied file-rank on different level', () => {
    // King at a3W wants to move to b3W
    // Pawn at b3N blocks the destination
    const pieces: PieceState[] = [
      { id: 'k1', type: 'king', color: 'white', squareId: 'a3W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3N', hasMoved: false },
    ];

    const result = isValidMove('k1', 'a3W', 'b3W', pieces, world, 'white');
    expect(result.valid).toBe(false);
  });

  it('should allow knight to move to occupied file-rank on different level', () => {
    // Knight at a1W wants to move to b3W
    // Pawn at b3N - knight should IGNORE vertical shadow
    const pieces: PieceState[] = [
      { id: 'n1', type: 'knight', color: 'white', squareId: 'a1W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3N', hasMoved: false },
    ];

    const result = isValidMove('n1', 'a1W', 'b3W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow pawn to move forward when destination is clear on all levels', () => {
    // Pawn at a2W wants to move to a3W
    // No piece at a3 on any level
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'a2W', hasMoved: false },
    ];

    const result = isValidMove('p1', 'a2W', 'a3W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });
});
