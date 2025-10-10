import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import type { WorldSquare } from '../types';

describe('World Builder', () => {
  const world = createChessWorld();

  it('should create 27 boards (3 main + 24 attack instances)', () => {
    expect(world.boards.size).toBe(27);
    expect(world.boards.has('WL')).toBe(true);
    expect(world.boards.has('NL')).toBe(true);
    expect(world.boards.has('BL')).toBe(true);
    
    const tracks = ['QL', 'KL'];
    const rotations = [0, 180];
    for (const track of tracks) {
      for (let pin = 1; pin <= 6; pin++) {
        for (const rotation of rotations) {
          const instanceId = `${track}${pin}:${rotation}`;
          expect(world.boards.has(instanceId)).toBe(true);
        }
      }
    }
  });

  it('should create correct number of squares for main boards', () => {
    const wlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'WL');
    const nlSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'NL');
    const blSquares = Array.from(world.squares.values()).filter((sq: WorldSquare) => sq.boardId === 'BL');
    
    expect(wlSquares.length).toBe(16);
    expect(nlSquares.length).toBe(16);
    expect(blSquares.length).toBe(16);
  });

  it('should create correct number of squares for attack board instances', () => {
    const tracks = ['QL', 'KL'];
    const rotations = [0, 180];
    
    for (const track of tracks) {
      for (let pin = 1; pin <= 6; pin++) {
        for (const rotation of rotations) {
          const instanceId = `${track}${pin}:${rotation}`;
          const instanceSquares = Array.from(world.squares.values()).filter(
            (sq: WorldSquare) => sq.boardId === instanceId
          );
          expect(instanceSquares.length).toBe(4);
        }
      }
    }
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

  it('should initialize all attack board instances as invisible', () => {
    const attackBoards = Array.from(world.boards.values()).filter((board) => board.type === 'attack');
    expect(attackBoards.length).toBe(24);
    
    attackBoards.forEach((board) => {
      expect(board.isVisible).toBe(false);
      expect(board.isAccessible).toBe(false);
    });
  });

  it('should set track and pin properties on attack board instances', () => {
    const ql1_0 = world.boards.get('QL1:0');
    expect(ql1_0).toBeDefined();
    expect(ql1_0?.track).toBe('QL');
    expect(ql1_0?.pin).toBe(1);
    expect(ql1_0?.rotation).toBe(0);

    const kl6_180 = world.boards.get('KL6:180');
    expect(kl6_180).toBeDefined();
    expect(kl6_180?.track).toBe('KL');
    expect(kl6_180?.pin).toBe(6);
    expect(kl6_180?.rotation).toBe(180);
  });
});
