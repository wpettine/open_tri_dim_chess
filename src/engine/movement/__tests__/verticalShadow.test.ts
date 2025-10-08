import { describe, it, expect } from 'vitest';
import { isValidMove, PieceState } from '../index';
import { createChessWorld } from '../../world/worldBuilder';

describe('Vertical Shadow Blocking in Movement', () => {
  const world = createChessWorld();

  it('should block rook from moving through a vertical shadow on same file-rank', () => {
    // Scenario: Rook at b2W wants to move to b4N
    // There's a pawn at b3W (blocking the file-rank column b-3)
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'b2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3W', hasMoved: false },
    ];

    // Rook trying to move from b2W to b4N (same file, crosses through rank 3)
    const result = isValidMove('r1', 'b2W', 'b4N', pieces, world, 'white');

    console.log('Vertical shadow test result:', result);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blocked');
  });

  it('should block bishop from moving diagonally through a vertical shadow', () => {
    // Bishop at a2W wants to move to c4N
    // There's a piece at b3W (at the diagonal path's file-rank)
    const pieces: PieceState[] = [
      { id: 'b1', type: 'bishop', color: 'white', squareId: 'a2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3W', hasMoved: false },
    ];

    const result = isValidMove('b1', 'a2W', 'c4N', pieces, world, 'white');

    console.log('Diagonal vertical shadow test result:', result);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blocked');
  });

  it('should allow knight to move through vertical shadows', () => {
    // Knight at a2W wants to move to c3W
    // There's a piece at b2W (in the L-shape path)
    const pieces: PieceState[] = [
      { id: 'n1', type: 'knight', color: 'white', squareId: 'a2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b2W', hasMoved: false },
    ];

    const result = isValidMove('n1', 'a2W', 'c3W', pieces, world, 'white');

    console.log('Knight through shadow test result:', result);
    expect(result.valid).toBe(true);
  });

  it('should allow piece to move on same level without vertical shadow blocking', () => {
    // Rook at a2W wants to move to d2W (same level, same rank)
    // There's a piece at b3W (different rank, shouldn't block)
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'a2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3W', hasMoved: false },
    ];

    const result = isValidMove('r1', 'a2W', 'd2W', pieces, world, 'white');

    console.log('Same level movement test result:', result);
    expect(result.valid).toBe(true);
  });
});
