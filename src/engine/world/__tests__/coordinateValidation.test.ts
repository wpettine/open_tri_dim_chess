import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import { fileToWorldX, rankToWorldY } from '../coordinates';

describe('Coordinate System Validation', () => {
  describe('Rank Continuity', () => {
    it('should have same worldY for same rank across different boards', () => {
      const world = createChessWorld();

      // Rank 4 appears on both W and N
      const a4W = world.squares.get('a4W');
      const a4N = world.squares.get('a4N');

      expect(a4W?.worldY).toBeDefined();
      expect(a4N?.worldY).toBeDefined();
      expect(a4W?.worldY).toBeCloseTo(a4N!.worldY, 5);

      // Rank 6 appears on both N and B
      const a6N = world.squares.get('a6N');
      const a6B = world.squares.get('a6B');

      expect(a6N?.worldY).toBeCloseTo(a6B!.worldY, 5);
    });

    it('should have sequential worldY values for sequential ranks', () => {
      const world = createChessWorld();

      const rank0 = world.squares.get('z0WQL')?.worldY;
      const rank1 = world.squares.get('z1WQL')?.worldY;
      const rank2 = world.squares.get('a2W')?.worldY;
      const rank3 = world.squares.get('a3W')?.worldY;

      expect(rank0).toBeDefined();
      expect(rank1).toBeDefined();
      expect(rank2).toBeDefined();
      expect(rank3).toBeDefined();

      // Check spacing is consistent
      const spacing01 = rank1! - rank0!;
      const spacing12 = rank2! - rank1!;
      const spacing23 = rank3! - rank2!;

      expect(spacing01).toBeCloseTo(spacing12, 5);
      expect(spacing12).toBeCloseTo(spacing23, 5);
    });
  });

  describe('File Consistency', () => {
    it('should have same worldX for same file across different boards', () => {
      const world = createChessWorld();

      // File 'a' (1) appears on main boards and attack boards
      const a2W = world.squares.get('a2W');
      const a4N = world.squares.get('a4N');
      const a6B = world.squares.get('a6B');

      expect(a2W?.worldX).toBeCloseTo(a4N!.worldX, 5);
      expect(a4N?.worldX).toBeCloseTo(a6B!.worldX, 5);
    });

    it('should have sequential worldX values for sequential files', () => {
      const world = createChessWorld();

      const fileZ = world.squares.get('z0WQL')?.worldX;
      const fileA = world.squares.get('a2W')?.worldX;
      const fileB = world.squares.get('b2W')?.worldX;
      const fileC = world.squares.get('c2W')?.worldX;

      expect(fileZ).toBeDefined();
      expect(fileA).toBeDefined();
      expect(fileB).toBeDefined();
      expect(fileC).toBeDefined();

      // Check spacing
      const spacingZA = fileA! - fileZ!;
      const spacingAB = fileB! - fileA!;
      const spacingBC = fileC! - fileB!;

      expect(spacingZA).toBeCloseTo(spacingAB, 5);
      expect(spacingAB).toBeCloseTo(spacingBC, 5);
    });
  });

  describe('Attack Board Positioning', () => {
    it('should position white attack boards before white main board', () => {
      const world = createChessWorld();

      // WQL at ranks 0-1 should have lower Y than W at ranks 1-4
      const maxAttackY = Math.max(
        world.squares.get('z1WQL')!.worldY,
        world.squares.get('a1WQL')!.worldY
      );

      const minMainY = Math.min(
        world.squares.get('a1W')!.worldY,
        world.squares.get('d1W')!.worldY
      );

      // They should overlap at rank 1
      expect(maxAttackY).toBeCloseTo(minMainY, 5);
    });

    it('should position black attack boards at correct ranks', () => {
      const world = createChessWorld();

      // BQL at ranks 8-9 should overlap with B at rank 8
      const maxMainY = Math.max(
        world.squares.get('a8B')!.worldY,
        world.squares.get('d8B')!.worldY
      );

      const minAttackY = Math.min(
        world.squares.get('z8BQL')!.worldY,
        world.squares.get('a8BQL')!.worldY
      );

      // They should overlap at rank 8
      expect(minAttackY).toBeCloseTo(maxMainY, 5);
    });
  });

  describe('Coordinate Function Tests', () => {
    it('should produce consistent results from coordinate functions', () => {
      // Test that direct function calls match world grid
      const world = createChessWorld();

      const testSquare = world.squares.get('b4N');
      expect(testSquare).toBeDefined();

      const calculatedX = fileToWorldX(2); // file 'b' = 2
      const calculatedY = rankToWorldY(4);

      expect(testSquare!.worldX).toBeCloseTo(calculatedX, 5);
      expect(testSquare!.worldY).toBeCloseTo(calculatedY, 5);
    });

    it('should maintain consistency for all ranks 0-9', () => {
      const world = createChessWorld();

      // Test that rank to worldY mapping is consistent
      for (let rank = 0; rank <= 9; rank++) {
        const expectedY = rankToWorldY(rank);

        // Find a square at this rank
        const squares = Array.from(world.squares.values()).filter(s => s.rank === rank);
        if (squares.length > 0) {
          squares.forEach(square => {
            expect(square.worldY).toBeCloseTo(expectedY, 5);
          });
        }
      }
    });

    it('should maintain consistency for all files z-e', () => {
      const world = createChessWorld();

      // Test that file to worldX mapping is consistent
      for (let file = 0; file <= 5; file++) {
        const expectedX = fileToWorldX(file);

        // Find squares at this file
        const squares = Array.from(world.squares.values()).filter(s => s.file === file);
        if (squares.length > 0) {
          squares.forEach(square => {
            expect(square.worldX).toBeCloseTo(expectedX, 5);
          });
        }
      }
    });
  });

  describe('Board Overlap Validation', () => {
    it('should have W and N overlap at ranks 3-4', () => {
      const world = createChessWorld();

      const wRank3 = world.squares.get('a3W');
      const nRank3 = world.squares.get('a3N');
      const wRank4 = world.squares.get('a4W');
      const nRank4 = world.squares.get('a4N');

      expect(wRank3).toBeDefined();
      expect(nRank3).toBeDefined();
      expect(wRank4).toBeDefined();
      expect(nRank4).toBeDefined();

      // Verify Y coordinates match
      expect(wRank3!.worldY).toBeCloseTo(nRank3!.worldY, 5);
      expect(wRank4!.worldY).toBeCloseTo(nRank4!.worldY, 5);
    });

    it('should have N and B overlap at ranks 5-6', () => {
      const world = createChessWorld();

      const nRank5 = world.squares.get('a5N');
      const bRank5 = world.squares.get('a5B');
      const nRank6 = world.squares.get('a6N');
      const bRank6 = world.squares.get('a6B');

      expect(nRank5).toBeDefined();
      expect(bRank5).toBeDefined();
      expect(nRank6).toBeDefined();
      expect(bRank6).toBeDefined();

      // Verify Y coordinates match
      expect(nRank5!.worldY).toBeCloseTo(bRank5!.worldY, 5);
      expect(nRank6!.worldY).toBeCloseTo(bRank6!.worldY, 5);
    });
  });
});
