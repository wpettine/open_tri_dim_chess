import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';

/**
 * Authoritative square color specification from REVISED_MEDER_COORDINATE_SYSTEM.md Appendix 3
 * This is the ground truth against which all colors must be validated.
 */
const AUTHORITATIVE_COLORS = {
  mainBoards: {
    W: {
      a1W: 'dark', b1W: 'light', c1W: 'dark', d1W: 'light',
      a2W: 'light', b2W: 'dark', c2W: 'light', d2W: 'dark',
      a3W: 'dark', b3W: 'light', c3W: 'dark', d3W: 'light',
      a4W: 'light', b4W: 'dark', c4W: 'light', d4W: 'dark',
    },
    N: {
      a3N: 'dark', b3N: 'light', c3N: 'dark', d3N: 'light',
      a4N: 'light', b4N: 'dark', c4N: 'light', d4N: 'dark',
      a5N: 'dark', b5N: 'light', c5N: 'dark', d5N: 'light',
      a6N: 'light', b6N: 'dark', c6N: 'light', d6N: 'dark',
    },
    B: {
      a5B: 'dark', b5B: 'light', c5B: 'dark', d5B: 'light',
      a6B: 'light', b6B: 'dark', c6B: 'light', d6B: 'dark',
      a7B: 'dark', b7B: 'light', c7B: 'dark', d7B: 'light',
      a8B: 'light', b8B: 'dark', c8B: 'light', d8B: 'dark',
    },
  },
  attackBoards: {
    QL1: { z0QL1: 'dark', a0QL1: 'light', z1QL1: 'light', a1QL1: 'dark' },
    QL2: { z4QL2: 'dark', a4QL2: 'light', z5QL2: 'light', a5QL2: 'dark' },
    QL3: { z2QL3: 'dark', a2QL3: 'light', z3QL3: 'light', a3QL3: 'dark' },
    QL4: { z6QL4: 'dark', a6QL4: 'light', z7QL4: 'light', a7QL4: 'dark' },
    QL5: { z4QL5: 'dark', a4QL5: 'light', z5QL5: 'light', a5QL5: 'dark' },
    QL6: { z8QL6: 'dark', a8QL6: 'light', z9QL6: 'light', a9QL6: 'dark' },
    KL1: { d0KL1: 'dark', e0KL1: 'light', d1KL1: 'light', e1KL1: 'dark' },
    KL2: { d4KL2: 'dark', e4KL2: 'light', d5KL2: 'light', e5KL2: 'dark' },
    KL3: { d2KL3: 'dark', e2KL3: 'light', d3KL3: 'light', e3KL3: 'dark' },
    KL4: { d6KL4: 'dark', e6KL4: 'light', d7KL4: 'light', e7KL4: 'dark' },
    KL5: { d4KL5: 'dark', e4KL5: 'light', d5KL5: 'light', e5KL5: 'dark' },
    KL6: { d8KL6: 'dark', e8KL6: 'light', d9KL6: 'light', e9KL6: 'dark' },
  },
} as const;

describe('Square Color Validation Against Authoritative Spec', () => {
  const world = createChessWorld();

  describe('Main Board W (White)', () => {
    Object.entries(AUTHORITATIVE_COLORS.mainBoards.W).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId}`, () => {
        const square = world.squares.get(squareId);
        expect(square).toBeDefined();
        expect(square?.color).toBe(expectedColor);
      });
    });
  });

  describe('Main Board N (Neutral)', () => {
    Object.entries(AUTHORITATIVE_COLORS.mainBoards.N).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId}`, () => {
        const square = world.squares.get(squareId);
        expect(square).toBeDefined();
        expect(square?.color).toBe(expectedColor);
      });
    });
  });

  describe('Main Board B (Black)', () => {
    Object.entries(AUTHORITATIVE_COLORS.mainBoards.B).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId}`, () => {
        const square = world.squares.get(squareId);
        expect(square).toBeDefined();
        expect(square?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL1', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL1).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        // Check rotation 0
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL1:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        // Check rotation 180
        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL1:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL2', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL2).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL2:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL2:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL3', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL3).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL3:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL3:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL4', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL4).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL4:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL4:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL5', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL5).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL5:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL5:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board QL6', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.QL6).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}QL6:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}QL6:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL1', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL1).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL1:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL1:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL2', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL2).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL2:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL2:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL3', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL3).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL3:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL3:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL4', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL4).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL4:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL4:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL5', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL5).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL5:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL5:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Attack Board KL6', () => {
    Object.entries(AUTHORITATIVE_COLORS.attackBoards.KL6).forEach(([squareId, expectedColor]) => {
      it(`should have ${expectedColor} square at ${squareId} (both rotations)`, () => {
        const square0 = world.squares.get(`${squareId.slice(0, -3)}KL6:0`);
        expect(square0).toBeDefined();
        expect(square0?.color).toBe(expectedColor);

        const square180 = world.squares.get(`${squareId.slice(0, -3)}KL6:180`);
        expect(square180).toBeDefined();
        expect(square180?.color).toBe(expectedColor);
      });
    });
  });

  describe('Vertical Color Alignment (Raumschach Rule)', () => {
    it('should have same color for a3W and a3N (same file/rank)', () => {
      const a3W = world.squares.get('a3W');
      const a3N = world.squares.get('a3N');
      expect(a3W?.color).toBe('dark');
      expect(a3N?.color).toBe('dark');
      expect(a3W?.color).toBe(a3N?.color);
    });

    it('should have same color for a4W and a4N (same file/rank)', () => {
      const a4W = world.squares.get('a4W');
      const a4N = world.squares.get('a4N');
      expect(a4W?.color).toBe('light');
      expect(a4N?.color).toBe('light');
      expect(a4W?.color).toBe(a4N?.color);
    });

    it('should have same color for a5N and a5B (same file/rank)', () => {
      const a5N = world.squares.get('a5N');
      const a5B = world.squares.get('a5B');
      expect(a5N?.color).toBe('dark');
      expect(a5B?.color).toBe('dark');
      expect(a5N?.color).toBe(a5B?.color);
    });

    it('should have same color for d5N and d5B (same file/rank)', () => {
      const d5N = world.squares.get('d5N');
      const d5B = world.squares.get('d5B');
      expect(d5N?.color).toBe('light');
      expect(d5B?.color).toBe('light');
      expect(d5N?.color).toBe(d5B?.color);
    });
  });

  describe('Diagonal Pattern Verification', () => {
    it('should alternate colors along a1W → b2W → c3W → d4W diagonal', () => {
      expect(world.squares.get('a1W')?.color).toBe('dark');
      expect(world.squares.get('b2W')?.color).toBe('dark');
      expect(world.squares.get('c3W')?.color).toBe('dark');
      expect(world.squares.get('d4W')?.color).toBe('dark');
    });

    it('should all be same color along b1W → c2W → d3W diagonal', () => {
      expect(world.squares.get('b1W')?.color).toBe('light');
      expect(world.squares.get('c2W')?.color).toBe('light');
      // d3W doesn't exist on W board, check d3N instead
      expect(world.squares.get('d3N')?.color).toBe('light');
    });
  });

  describe('Rank Pattern Verification', () => {
    it('should alternate colors along rank 1 of W board', () => {
      expect(world.squares.get('a1W')?.color).toBe('dark');
      expect(world.squares.get('b1W')?.color).toBe('light');
      expect(world.squares.get('c1W')?.color).toBe('dark');
      expect(world.squares.get('d1W')?.color).toBe('light');
    });

    it('should alternate colors along rank 2 of W board', () => {
      expect(world.squares.get('a2W')?.color).toBe('light');
      expect(world.squares.get('b2W')?.color).toBe('dark');
      expect(world.squares.get('c2W')?.color).toBe('light');
      expect(world.squares.get('d2W')?.color).toBe('dark');
    });
  });

  describe('File Pattern Verification', () => {
    it('should alternate colors along file a from W to N', () => {
      expect(world.squares.get('a1W')?.color).toBe('dark');
      expect(world.squares.get('a2W')?.color).toBe('light');
      expect(world.squares.get('a3W')?.color).toBe('dark');
      expect(world.squares.get('a4W')?.color).toBe('light');
      expect(world.squares.get('a3N')?.color).toBe('dark');
      expect(world.squares.get('a4N')?.color).toBe('light');
    });
  });
});
