import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../../world/worldBuilder';
import { isValidMove } from '../index';
import { PieceState } from '../types';

describe('Pawn Movement Validation', () => {
  const world = createChessWorld();

  it('should allow single step forward for white pawn', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'b4W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow single step forward for black pawn', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'b6B',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b6B', 'b5B', pieces, world, 'black');
    expect(result.valid).toBe(true);
  });

  it('should allow double step from starting position (white)', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b2W', // White pawns start at rank 2 on main board
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b2W', 'b4N', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow double step from starting position (black)', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'black',
        squareId: 'b7B', // Black pawns start at rank 7 on main board
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b7B', 'b5N', pieces, world, 'black');
    expect(result.valid).toBe(true);
  });

  it('should reject double step if pawn has already moved', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: true // Already moved
      }
    ];

    const result = isValidMove('p1', 'b3W', 'b5N', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('first move');
  });

  it('should reject double step if pawn moved as passenger', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false,
        movedAsPassenger: true // Moved with attack board
      }
    ];

    const result = isValidMove('p1', 'b3W', 'b5N', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('first move');
  });

  it('should allow diagonal capture (white)', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      },
      {
        id: 'p2',
        type: 'pawn',
        color: 'black',
        squareId: 'c4W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'c4W', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should allow diagonal capture across levels', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      },
      {
        id: 'p2',
        type: 'pawn',
        color: 'black',
        squareId: 'c4N',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'c4N', pieces, world, 'white');
    expect(result.valid).toBe(true);
  });

  it('should reject diagonal move without capture', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'c4W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('capturing');
  });

  it('should reject forward move if blocked by piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      },
      {
        id: 'p2',
        type: 'pawn',
        color: 'black',
        squareId: 'b4W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'b4W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cannot capture');
  });

  it('should reject backward movement', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'b2W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('forward');
  });

  it('should reject capturing own piece', () => {
    const pieces: PieceState[] = [
      {
        id: 'p1',
        type: 'pawn',
        color: 'white',
        squareId: 'b3W',
        hasMoved: false
      },
      {
        id: 'p2',
        type: 'pawn',
        color: 'white',
        squareId: 'c4W',
        hasMoved: false
      }
    ];

    const result = isValidMove('p1', 'b3W', 'c4W', pieces, world, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('own piece');
  });
});
