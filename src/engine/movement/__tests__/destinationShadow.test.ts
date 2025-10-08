import { describe, it, expect } from 'vitest';
import { isValidMove, PieceState } from '../index';
import { createChessWorld } from '../../world/worldBuilder';

describe('Destination Vertical Shadow Blocking', () => {
  const world = createChessWorld();

  it('should prevent white pawn from moving to a5N when black pawn is at a5B', () => {
    // White pawn at a4N wants to move to a5N
    // Black pawn already at a5B (same file-rank, different level)
    // This should be BLOCKED
    const pieces: PieceState[] = [
      { id: 'wp1', type: 'pawn', color: 'white', squareId: 'a4N', hasMoved: false },
      { id: 'bp1', type: 'pawn', color: 'black', squareId: 'a5B', hasMoved: false },
    ];

    const result = isValidMove('wp1', 'a4N', 'a5N', pieces, world, 'white');

    console.log('White pawn a4N -> a5N with black pawn at a5B:', result);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blocked');
  });

  it('should prevent black pawn from moving to a5N when white pawn is at a5B', () => {
    // Black pawn at a6N wants to move to a5N
    // White pawn already at a5B (same file-rank, different level)
    // This should be BLOCKED
    const pieces: PieceState[] = [
      { id: 'bp1', type: 'pawn', color: 'black', squareId: 'a6N', hasMoved: false },
      { id: 'wp1', type: 'pawn', color: 'white', squareId: 'a5B', hasMoved: false },
    ];

    const result = isValidMove('bp1', 'a6N', 'a5N', pieces, world, 'black');

    console.log('Black pawn a6N -> a5N with white pawn at a5B:', result);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blocked');
  });

  it('should allow move if destination file-rank is not occupied', () => {
    // White pawn at a4N wants to move to a5N
    // No piece at a5 on any level - should allow
    const pieces: PieceState[] = [
      { id: 'wp1', type: 'pawn', color: 'white', squareId: 'a4N', hasMoved: false },
    ];

    const result = isValidMove('wp1', 'a4N', 'a5N', pieces, world, 'white');

    console.log('White pawn a4N -> a5N with no obstruction:', result);
    expect(result.valid).toBe(true);
  });

  it('should allow knight to move to occupied file-rank on different level', () => {
    // Knight at a1W wants to move to b3W
    // Pawn at b3N (same file-rank, different level)
    // Knights ignore vertical shadows - should allow
    const pieces: PieceState[] = [
      { id: 'n1', type: 'knight', color: 'white', squareId: 'a1W', hasMoved: false },
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b3N', hasMoved: false },
    ];

    const result = isValidMove('n1', 'a1W', 'b3W', pieces, world, 'white');

    console.log('Knight a1W -> b3W with pawn at b3N:', result);
    expect(result.valid).toBe(true);
  });
});
