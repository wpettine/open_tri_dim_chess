import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import { Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN, ATTACK_OFFSET } from '../pinPositions';

describe('Attack Board Z-Axis Positioning', () => {
  const world = createChessWorld();

  it('should position all attack boards at correct z-heights above their main boards', () => {
    const expectedZHeights: Record<number, number> = {
      1: Z_WHITE_MAIN + ATTACK_OFFSET,
      2: Z_WHITE_MAIN + ATTACK_OFFSET,
      3: Z_NEUTRAL_MAIN + ATTACK_OFFSET,
      4: Z_NEUTRAL_MAIN + ATTACK_OFFSET,
      5: Z_BLACK_MAIN + ATTACK_OFFSET,
      6: Z_BLACK_MAIN + ATTACK_OFFSET,
    };

    const tracks = ['QL', 'KL'] as const;
    const rotations = [0, 180] as const;

    for (const track of tracks) {
      for (let pin = 1; pin <= 6; pin++) {
        const expectedZ = expectedZHeights[pin];
        
        for (const rotation of rotations) {
          const instanceId = `${track}${pin}:${rotation}`;
          const board = world.boards.get(instanceId);
          
          expect(board).toBeDefined();
          expect(board?.centerZ).toBe(expectedZ);
        }
      }
    }
  });

  it('should have identical z-heights for both rotations of each pin', () => {
    const tracks = ['QL', 'KL'] as const;

    for (const track of tracks) {
      for (let pin = 1; pin <= 6; pin++) {
        const board0 = world.boards.get(`${track}${pin}:0`);
        const board180 = world.boards.get(`${track}${pin}:180`);
        
        expect(board0).toBeDefined();
        expect(board180).toBeDefined();
        expect(board0?.centerZ).toBe(board180?.centerZ);
      }
    }
  });

  it('should have all squares on each board instance at the same worldZ as the board centerZ', () => {
    const tracks = ['QL', 'KL'] as const;
    const rotations = [0, 180] as const;

    for (const track of tracks) {
      for (let pin = 1; pin <= 6; pin++) {
        for (const rotation of rotations) {
          const instanceId = `${track}${pin}:${rotation}`;
          const board = world.boards.get(instanceId);
          
          expect(board).toBeDefined();
          
          const boardSquares = Array.from(world.squares.values()).filter(
            (sq) => sq.boardId === instanceId
          );
          
          expect(boardSquares.length).toBe(4);
          
          for (const square of boardSquares) {
            expect(square.worldZ).toBe(board?.centerZ);
          }
        }
      }
    }
  });

  it('should maintain uniform vertical spacing pattern', () => {
    const pin1Z = world.boards.get('QL1:0')?.centerZ;
    const pin2Z = world.boards.get('QL2:0')?.centerZ;
    const pin3Z = world.boards.get('QL3:0')?.centerZ;
    const pin4Z = world.boards.get('QL4:0')?.centerZ;
    const pin5Z = world.boards.get('QL5:0')?.centerZ;
    const pin6Z = world.boards.get('QL6:0')?.centerZ;

    expect(pin1Z).toBeDefined();
    expect(pin2Z).toBeDefined();
    expect(pin3Z).toBeDefined();
    expect(pin4Z).toBeDefined();
    expect(pin5Z).toBeDefined();
    expect(pin6Z).toBeDefined();

    expect(pin1Z).toBe(pin2Z);
    expect(pin3Z).toBe(pin4Z);
    expect(pin5Z).toBe(pin6Z);

    expect(pin3Z).toBeGreaterThan(pin1Z!);
    expect(pin5Z).toBeGreaterThan(pin3Z!);
  });
});
