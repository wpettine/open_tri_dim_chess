import { describe, it, expect } from 'vitest';
import { isValidMove, PieceState } from '../index';
import { createChessWorld } from '../../world/worldBuilder';

describe('Cross-Level Vertical Shadow', () => {
  const world = createChessWorld();

  it('should block bishop moving from W to N if path crosses occupied file-rank', () => {
    // Bishop at a2W (file=1, rank=2) wants to move to c4N (file=3, rank=4)
    // Path crosses b3 (file=2, rank=3)
    // There's a pawn at b3W - should block the move
    const pieces: PieceState[] = [
      { id: 'b1', type: 'bishop', color: 'white', squareId: 'a2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3W', hasMoved: false },
    ];

    const result = isValidMove('b1', 'a2W', 'c4N', pieces, world, 'white');

    console.log('Cross-level diagonal result:', result);
    expect(result.valid).toBe(false);
  });

  it('should block rook moving between levels if same file-rank is occupied', () => {
    // Rook at b2W wants to move to b4N (different levels, crosses b3)
    // There's a pawn at b3N - should block
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'b2W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3N', hasMoved: false },
    ];

    const result = isValidMove('r1', 'b2W', 'b4N', pieces, world, 'white');

    console.log('Cross-level rook result:', result);
    expect(result.valid).toBe(false);
  });

  it('should allow move if no piece blocks the file-rank column', () => {
    // Bishop at a2W wants to move to c4N
    // No piece at b3 on any level - should allow
    const pieces: PieceState[] = [
      { id: 'b1', type: 'bishop', color: 'white', squareId: 'a2W', hasMoved: false },
    ];

    const result = isValidMove('b1', 'a2W', 'c4N', pieces, world, 'white');

    console.log('Clear path cross-level result:', result);
    expect(result.valid).toBe(true);
  });
});
