import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../../world/worldBuilder';
import { isValidMove } from '../index';
import { PieceState } from '../types';

describe('Knight Movement Validation', () => {
  const world = createChessWorld();

  it('should allow valid L-shape movement (2,1)', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      }
    ];

    // b2W -> d3W (2 files, 1 rank)
    const result = isValidMove('n1', 'b2W', 'd3W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow valid L-shape movement (1,2)', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      }
    ];

    // b2W -> c4W (1 file, 2 ranks)
    const result = isValidMove('n1', 'b2W', 'c4W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow L-shape movement across levels', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      }
    ];

    // b2W -> c4N (crosses from W to N board)
    const result = isValidMove('n1', 'b2W', 'c4N', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should IGNORE vertical shadow (can jump over pieces)', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      },
      // Place pieces in all potential blocking positions
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'b3W',
        hasMoved: false
      },
      {
        id: 'p2',
        type: 'pawn',
        color: 'black',
        squareId: 'c3W',
        hasMoved: false
      },
      {
        id: 'p3',
        type: 'pawn',
        color: 'black',
        squareId: 'c2W',
        hasMoved: false
      }
    ];

    // Knight should still be able to jump to c4N despite blocking pieces
    const result = isValidMove('n1', 'b2W', 'c4N', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should reject non L-shape movement', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      }
    ];

    // b2W -> d4N is not an L-shape
    const result = isValidMove('n1', 'b2W', 'd4N', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('L-shape');
  });

  it('should allow capturing enemy piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      },
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'd3W',
        hasMoved: false
      }
    ];

    const result = isValidMove('n1', 'b2W', 'd3W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should reject capturing own piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'n1',
        type: 'knight',
        color: 'white',
        squareId: 'b2W',
        hasMoved: false
      },
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'd3W',
        hasMoved: false
      }
    ];

    const result = isValidMove('n1', 'b2W', 'd3W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('own piece');
  });
});
