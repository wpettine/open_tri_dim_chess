import { describe, it, expect } from 'vitest';
import { isPathClear, getPathCoordinates, isPieceAt } from '../pathValidation';
import { createChessWorld } from '../../world/worldBuilder';
import { Piece } from '../../../store/gameStore';

describe('pathValidation', () => {
  describe('getPathCoordinates', () => {
    it('should return empty path for adjacent squares', () => {
      const world = createChessWorld();
      const from = world.squares.get('a1W')!;
      const to = world.squares.get('a2W')!;

      const path = getPathCoordinates(from, to);

      expect(path).toEqual([]);
    });

    it('should calculate horizontal path', () => {
      const world = createChessWorld();
      const from = world.squares.get('a1W')!;
      const to = world.squares.get('d1W')!;

      const path = getPathCoordinates(from, to);

      expect(path).toHaveLength(2);
      expect(path[0]).toEqual({ file: 2, rank: 1 });
      expect(path[1]).toEqual({ file: 3, rank: 1 });
    });

    it('should calculate vertical path', () => {
      const world = createChessWorld();
      const from = world.squares.get('b2W')!;
      const to = world.squares.get('b4W')!;

      const path = getPathCoordinates(from, to);

      expect(path).toHaveLength(1);
      expect(path[0]).toEqual({ file: 2, rank: 3 });
    });

    it('should calculate diagonal path', () => {
      const world = createChessWorld();
      const from = world.squares.get('a1W')!;
      const to = world.squares.get('c3W')!;

      const path = getPathCoordinates(from, to);

      expect(path).toHaveLength(1);
      expect(path[0]).toEqual({ file: 2, rank: 2 });
    });
  });

  describe('isPathClear', () => {
    it('should return true when path is clear', () => {
      const world = createChessWorld();
      const from = world.squares.get('a1W')!;
      const to = world.squares.get('d1W')!;
      const pieces: Piece[] = [];

      const result = isPathClear(from, to, world, pieces);

      expect(result).toBe(true);
    });

    it('should return false when path is blocked on same level', () => {
      const world = createChessWorld();
      const from = world.squares.get('a1W')!;
      const to = world.squares.get('d1W')!;
      const pieces: Piece[] = [
        {
          id: 'blocker',
          type: 'pawn',
          color: 'black',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isPathClear(from, to, world, pieces);

      expect(result).toBe(false);
    });

    it('should return false when path is blocked by vertical shadow on different level', () => {
      const world = createChessWorld();
      const from = world.squares.get('b2W')!;
      const to = world.squares.get('d4W')!;
      const pieces: Piece[] = [
        {
          id: 'blocker',
          type: 'pawn',
          color: 'black',
          file: 3,
          rank: 3,
          level: 'N',
          hasMoved: false,
        },
      ];

      const result = isPathClear(from, to, world, pieces);

      expect(result).toBe(false);
    });
  });

  describe('isPieceAt', () => {
    it('should return true when piece exists at square', () => {
      const pieces: Piece[] = [
        {
          id: 'test',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isPieceAt('a2W', pieces);

      expect(result).toBe(true);
    });

    it('should return false when no piece at square', () => {
      const pieces: Piece[] = [
        {
          id: 'test',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isPieceAt('b3W', pieces);

      expect(result).toBe(false);
    });
  });
});
