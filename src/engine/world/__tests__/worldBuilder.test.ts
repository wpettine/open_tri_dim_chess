import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import type { WorldSquare } from '../types';

describe('World Builder', () => {
  const world = createChessWorld();

  it('should create 99 boards (3 main + 96 attack board instances)', () => {
    expect(world.boards.size).toBe(99);
    expect(world.boards.has('W')).toBe(true);
    expect(world.boards.has('N')).toBe(true);
    expect(world.boards.has('B')).toBe(true);
    
    const attackBoardBases = ['WQL', 'WKL', 'BQL', 'BKL'];
    const pins = ['QL1', 'QL2', 'QL3', 'QL4', 'QL5', 'QL6', 'KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'];
    
    attackBoardBases.forEach(base => {
      pins.forEach(pin => {
        expect(world.boards.has(`${base}_${pin}`)).toBe(true);
        expect(world.boards.has(`${base}_${pin}_R180`)).toBe(true);
      });
    });
  });

  it('should create correct number of squares for main boards', () => {
    const wSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'W');
    const nSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'N');
    const bSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'B');
    
    expect(wSquares.length).toBe(16);
    expect(nSquares.length).toBe(16);
    expect(bSquares.length).toBe(16);
  });

  it('should create correct number of squares for attack board instances', () => {
    const wqlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId.startsWith('WQL_'));
    const wklSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId.startsWith('WKL_'));
    const bqlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId.startsWith('BQL_'));
    const bklSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId.startsWith('BKL_'));
    
    expect(wqlSquares.length).toBe(96);
    expect(wklSquares.length).toBe(96);
    expect(bqlSquares.length).toBe(96);
    expect(bklSquares.length).toBe(96);
  });

  it('should have unique square IDs', () => {
    const ids = Array.from(world.squares.keys());
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have valid world coordinates for all squares', () => {
    world.squares.forEach((square) => {
      expect(typeof square.worldX).toBe('number');
      expect(typeof square.worldY).toBe('number');
      expect(typeof square.worldZ).toBe('number');
      expect(isFinite(square.worldX)).toBe(true);
      expect(isFinite(square.worldY)).toBe(true);
      expect(isFinite(square.worldZ)).toBe(true);
    });
  });

  it('should have valid board centers', () => {
    world.boards.forEach((board) => {
      expect(typeof board.centerX).toBe('number');
      expect(typeof board.centerY).toBe('number');
      expect(typeof board.centerZ).toBe('number');
      expect(isFinite(board.centerX)).toBe(true);
      expect(isFinite(board.centerY)).toBe(true);
      expect(isFinite(board.centerZ)).toBe(true);
    });
  });

  it('should load all pin positions', () => {
    expect(world.pins.size).toBe(12);
    expect(world.pins.has('QL1')).toBe(true);
    expect(world.pins.has('KL6')).toBe(true);
  });
});
