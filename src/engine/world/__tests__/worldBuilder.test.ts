import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import type { WorldSquare } from '../types';

describe('World Builder', () => {
  const world = createChessWorld();

  it('should create 7 boards', () => {
    expect(world.boards.size).toBe(7);
    expect(world.boards.has('WL')).toBe(true);
    expect(world.boards.has('NL')).toBe(true);
    expect(world.boards.has('BL')).toBe(true);
    expect(world.boards.has('WQL')).toBe(true);
    expect(world.boards.has('WKL')).toBe(true);
    expect(world.boards.has('BQL')).toBe(true);
    expect(world.boards.has('BKL')).toBe(true);
  });

  it('should create correct number of squares for main boards', () => {
    const wlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'WL');
    const nlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'NL');
    const blSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'BL');
    
    expect(wlSquares.length).toBe(16);
    expect(nlSquares.length).toBe(16);
    expect(blSquares.length).toBe(16);
  });

  it('should create correct number of squares for attack boards', () => {
    const wqlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'WQL');
    const wklSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'WKL');
    const bqlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'BQL');
    const bklSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'BKL');
    
    expect(wqlSquares.length).toBe(4);
    expect(wklSquares.length).toBe(4);
    expect(bqlSquares.length).toBe(4);
    expect(bklSquares.length).toBe(4);
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
