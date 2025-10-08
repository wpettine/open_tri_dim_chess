import { describe, it, expect } from 'vitest';
import { isBlockedByVerticalShadow, getBoardFootprint } from '../verticalShadow';
import { createChessWorld } from '../../world/worldBuilder';
import { PieceState } from '../../movement/types';

describe('Vertical Shadow for Attack Boards', () => {
  const world = createChessWorld();

  it('should not block if no pieces are below', () => {
    const pieces: PieceState[] = [];
    expect(isBlockedByVerticalShadow('QL3', pieces, world)).toBe(false);
  });

  it('should block if non-knight piece is directly below board position', () => {
    // QL2 covers files z-a (0-1), ranks 2-3
    // White main board has ranks 2-3, so place a rook at a2W (file 1, rank 2)
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'a2W', hasMoved: false },
    ];
    expect(isBlockedByVerticalShadow('QL2', pieces, world)).toBe(true);
  });

  it('should NOT block if knight is below (knights exempt from shadow)', () => {
    const pieces: PieceState[] = [
      { id: 'n1', type: 'knight', color: 'white', squareId: 'a2W', hasMoved: false },
    ];
    expect(isBlockedByVerticalShadow('QL2', pieces, world)).toBe(false);
  });

  it('should block if piece is on any of the 4 board squares', () => {
    // QL2: files 0-1, ranks 2-3 (overlaps with white board)
    // File 0 (z) doesn't exist on White board, so test file 1 only
    const testCases = [
      { squareId: 'a2W', file: 1, rank: 2 }, // q2
      { squareId: 'a3W', file: 1, rank: 3 }, // q4
    ];

    for (const testCase of testCases) {
      const pieces: PieceState[] = [
        { id: 'p1', type: 'pawn', color: 'white', squareId: testCase.squareId, hasMoved: false },
      ];
      expect(isBlockedByVerticalShadow('QL2', pieces, world)).toBe(true);
    }
  });

  it('should not block if piece is outside board footprint', () => {
    // QL2 covers files 0-1, ranks 2-3
    // Place piece at file 2, rank 2 (outside board)
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'b2W', hasMoved: false },
    ];
    expect(isBlockedByVerticalShadow('QL2', pieces, world)).toBe(false);
  });

  it('should return correct board footprint', () => {
    // QL1: fileOffset=0, rankOffset=0
    const footprint = getBoardFootprint('QL1', world);
    expect(footprint).toHaveLength(4);
    expect(footprint).toContainEqual({ file: 0, rank: 0 });
    expect(footprint).toContainEqual({ file: 1, rank: 0 });
    expect(footprint).toContainEqual({ file: 0, rank: 1 });
    expect(footprint).toContainEqual({ file: 1, rank: 1 });
  });
});
