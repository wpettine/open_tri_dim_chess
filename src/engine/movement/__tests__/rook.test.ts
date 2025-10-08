import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../../world/worldBuilder';
import { isValidMove } from '../index';
import { PieceState } from '../types';

describe('Rook Movement Validation', () => {
  const world = createChessWorld();

  it('should allow straight file movement on same board', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      }
    ];

    const result = isValidMove('r1', 'a2W', 'a4W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow straight rank movement on same board', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      }
    ];

    const result = isValidMove('r1', 'a2W', 'd2W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow file movement across levels (W to N to B)', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      }
    ];

    // a2W -> a7B (crosses multiple levels)
    const result = isValidMove('r1', 'a2W', 'a7B', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should block movement if path has a piece (vertical shadow)', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      },
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'a4N', // Blocking the a4 column
        hasMoved: false
      }
    ];

    // Cannot move to a7B because a4N blocks the vertical column
    const result = isValidMove('r1', 'a2W', 'a7B', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blocked');
  });

  it('should reject diagonal movement', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      }
    ];

    const result = isValidMove('r1', 'a2W', 'b3W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('files or ranks');
  });

  it('should reject purely vertical movement (same file/rank, different level)', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a4W',
        hasMoved: false
      }
    ];

    // a4W -> a4N is purely vertical (prohibited)
    const result = isValidMove('r1', 'a4W', 'a4N', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('purely vertically');
  });

  it('should allow capturing enemy piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      },
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'a4W',
        hasMoved: false
      }
    ];

    const result = isValidMove('r1', 'a2W', 'a4W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should reject capturing own piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'r1',
        type: 'rook',
        color: 'white',
        squareId: 'a2W',
        hasMoved: false
      },
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'a4W',
        hasMoved: false
      }
    ];

    const result = isValidMove('r1', 'a2W', 'a4W', pieces, world, 'white');
    expect(result.valid).toBe(false);
  });
});
