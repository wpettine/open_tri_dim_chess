import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import type { WorldSquare } from '../types';

describe('Coordinate Validation', () => {
  const world = createChessWorld();

  it('should have same worldY for same rank across different boards', () => {
    const rank4WL = world.squares.get('a4W');
    const rank4NL = world.squares.get('a4N');
    
    expect(rank4WL).toBeDefined();
    expect(rank4NL).toBeDefined();
    
    if (rank4WL && rank4NL) {
      expect(rank4WL.worldY).toBe(rank4NL.worldY);
    }

    const rank6NL = world.squares.get('a6N');
    const rank6BL = world.squares.get('a6B');
    
    expect(rank6NL).toBeDefined();
    expect(rank6BL).toBeDefined();
    
    if (rank6NL && rank6BL) {
      expect(rank6NL.worldY).toBe(rank6BL.worldY);
    }
  });

  it('should have same worldX for same file across different boards', () => {
    const fileAWL = world.squares.get('a2W');
    const fileANL = world.squares.get('a4N');
    const fileABL = world.squares.get('a6B');
    
    expect(fileAWL).toBeDefined();
    expect(fileANL).toBeDefined();
    expect(fileABL).toBeDefined();
    
    if (fileAWL && fileANL && fileABL) {
      expect(fileAWL.worldX).toBe(fileANL.worldX);
      expect(fileANL.worldX).toBe(fileABL.worldX);
    }
  });

  it('should align attack board coordinates with rank system', () => {
    const rank0QL1 = world.squares.get('z0QL1:0');
    const rank1QL1 = world.squares.get('z1QL1:0');
    
    expect(rank0QL1).toBeDefined();
    expect(rank1QL1).toBeDefined();
    
    if (rank0QL1 && rank1QL1) {
      expect(rank1QL1.worldY).toBeGreaterThan(rank0QL1.worldY);
      expect(rank1QL1.worldY - rank0QL1.worldY).toBeCloseTo(2.1, 1);
    }

    const rank8QL6 = world.squares.get('z8QL6:0');
    const rank9QL6 = world.squares.get('z9QL6:0');
    
    expect(rank8QL6).toBeDefined();
    expect(rank9QL6).toBeDefined();
    
    if (rank8QL6 && rank9QL6) {
      expect(rank9QL6.worldY).toBeGreaterThan(rank8QL6.worldY);
      expect(rank9QL6.worldY - rank8QL6.worldY).toBeCloseTo(2.1, 1);
    }
  });

  it('should have consistent coordinate functions', () => {
    const squares = Array.from(world.squares.values());
    
    for (const square of squares) {
      const otherSquares = squares.filter(
        (s: WorldSquare) => s.rank === (square as WorldSquare).rank && s.id !== (square as WorldSquare).id
      );
      
      for (const other of otherSquares) {
        expect((square as WorldSquare).worldY).toBe((other as WorldSquare).worldY);
      }
    }

    for (const square of squares) {
      const otherSquares = squares.filter(
        (s: WorldSquare) => s.file === (square as WorldSquare).file && s.id !== (square as WorldSquare).id
      );
      
      for (const other of otherSquares) {
        expect((square as WorldSquare).worldX).toBe((other as WorldSquare).worldX);
      }
    }
  });
});
