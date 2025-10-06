import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';

describe('World Grid Creation', () => {
  it('should create a world with all boards', () => {
    const world = createChessWorld();

    expect(world.boards.size).toBe(7); // 3 main + 4 attack
    expect(world.boards.has('W')).toBe(true);
    expect(world.boards.has('N')).toBe(true);
    expect(world.boards.has('B')).toBe(true);
    expect(world.boards.has('WQL')).toBe(true);
    expect(world.boards.has('WKL')).toBe(true);
    expect(world.boards.has('BQL')).toBe(true);
    expect(world.boards.has('BKL')).toBe(true);
  });

  it('should create all squares for main boards', () => {
    const world = createChessWorld();

    // Each main board has 4x4 = 16 squares
    const wSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'W');
    expect(wSquares.length).toBe(16);

    const nSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'N');
    expect(nSquares.length).toBe(16);

    const bSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'B');
    expect(bSquares.length).toBe(16);
  });

  it('should create all squares for attack boards', () => {
    const world = createChessWorld();

    // Each attack board has 2x2 = 4 squares
    const wqlSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'WQL');
    expect(wqlSquares.length).toBe(4);

    const wklSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'WKL');
    expect(wklSquares.length).toBe(4);

    const bqlSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'BQL');
    expect(bqlSquares.length).toBe(4);

    const bklSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'BKL');
    expect(bklSquares.length).toBe(4);
  });

  it('should have unique square IDs', () => {
    const world = createChessWorld();
    const ids = Array.from(world.squares.keys());
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have valid world coordinates for all squares', () => {
    const world = createChessWorld();

    world.squares.forEach(square => {
      expect(typeof square.worldX).toBe('number');
      expect(typeof square.worldY).toBe('number');
      expect(typeof square.worldZ).toBe('number');
      expect(isFinite(square.worldX)).toBe(true);
      expect(isFinite(square.worldY)).toBe(true);
      expect(isFinite(square.worldZ)).toBe(true);
    });
  });

  it('should have valid board centers', () => {
    const world = createChessWorld();

    world.boards.forEach(board => {
      expect(typeof board.centerX).toBe('number');
      expect(typeof board.centerY).toBe('number');
      expect(typeof board.centerZ).toBe('number');
      expect(isFinite(board.centerX)).toBe(true);
      expect(isFinite(board.centerY)).toBe(true);
      expect(isFinite(board.centerZ)).toBe(true);
    });
  });

  it('should load all pin positions', () => {
    const world = createChessWorld();

    expect(world.pins.size).toBeGreaterThan(0);
    expect(world.pins.has('QL1')).toBe(true);
    expect(world.pins.has('KL1')).toBe(true);
  });

  it('should correctly configure main boards', () => {
    const world = createChessWorld();

    const wBoard = world.boards.get('W');
    expect(wBoard?.type).toBe('main');
    expect(wBoard?.canMove).toBe(false);
    expect(wBoard?.size.width).toBe(4);
    expect(wBoard?.size.height).toBe(4);

    const nBoard = world.boards.get('N');
    expect(nBoard?.type).toBe('main');
    expect(nBoard?.canMove).toBe(false);
    expect(nBoard?.size.width).toBe(4);
    expect(nBoard?.size.height).toBe(4);

    const bBoard = world.boards.get('B');
    expect(bBoard?.type).toBe('main');
    expect(bBoard?.canMove).toBe(false);
    expect(bBoard?.size.width).toBe(4);
    expect(bBoard?.size.height).toBe(4);
  });

  it('should correctly configure attack boards', () => {
    const world = createChessWorld();

    const wqlBoard = world.boards.get('WQL');
    expect(wqlBoard?.type).toBe('attack');
    expect(wqlBoard?.canMove).toBe(true);
    expect(wqlBoard?.size.width).toBe(2);
    expect(wqlBoard?.size.height).toBe(2);
    expect(wqlBoard?.currentPin).toBe('QL1');

    const bklBoard = world.boards.get('BKL');
    expect(bklBoard?.type).toBe('attack');
    expect(bklBoard?.canMove).toBe(true);
    expect(bklBoard?.currentPin).toBe('KL6');
  });
});
