import { describe, it, expect, beforeEach } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import { updateInstanceVisibility, setVisibleInstances, showAllAttackInstances } from '../visibility';
import type { ChessWorld } from '../types';

describe('Instance Visibility System', () => {
  let world: ChessWorld;

  beforeEach(() => {
    world = createChessWorld();
  });

  it('should show only 4 instances based on trackStates', () => {
    const trackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    updateInstanceVisibility(world, trackStates);

    // Count visible attack board instances
    let visibleCount = 0;
    const visibleIds: string[] = [];
    world.boards.forEach((board, id) => {
      if (board.type === 'attack' && board.isVisible && id.includes(':')) {
        visibleCount++;
        visibleIds.push(id);
      }
    });

    expect(visibleCount).toBe(4);
    expect(visibleIds).toContain('QL1:0');
    expect(visibleIds).toContain('KL1:0');
    expect(visibleIds).toContain('QL6:0');
    expect(visibleIds).toContain('KL6:0');
  });

  it('should hide all other instances', () => {
    const trackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    updateInstanceVisibility(world, trackStates);

    // Count hidden attack board instances
    let hiddenCount = 0;
    world.boards.forEach((board, id) => {
      if (board.type === 'attack' && !board.isVisible && id.includes(':')) {
        hiddenCount++;
      }
    });

    // Total instances = 2 tracks * 6 pins * 2 rotations = 24
    // Visible = 4, so hidden should be 20
    expect(hiddenCount).toBe(20);
  });

  it('should update visibility when attack board moves to new pin', () => {
    // Initial state
    const initialTrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };
    updateInstanceVisibility(world, initialTrackStates);

    expect(world.boards.get('QL1:0')?.isVisible).toBe(true);
    expect(world.boards.get('QL2:0')?.isVisible).toBe(false);

    // Move white QL board from pin 1 to pin 2
    const updatedTrackStates = {
      QL: { whiteBoardPin: 2, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };
    updateInstanceVisibility(world, updatedTrackStates);

    expect(world.boards.get('QL1:0')?.isVisible).toBe(false);
    expect(world.boards.get('QL2:0')?.isVisible).toBe(true);
    expect(world.boards.get('QL6:0')?.isVisible).toBe(true); // Black board unchanged
  });

  it('should handle two boards on same track at different pins', () => {
    const trackStates = {
      QL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 0 as 0 | 180, blackRotation: 180 as 0 | 180 },
      KL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    updateInstanceVisibility(world, trackStates);

    // White QL at pin 2, rotation 0
    expect(world.boards.get('QL2:0')?.isVisible).toBe(true);
    expect(world.boards.get('QL2:0')?.isAccessible).toBe(true);

    // Black QL at pin 5, rotation 180
    expect(world.boards.get('QL5:180')?.isVisible).toBe(true);
    expect(world.boards.get('QL5:180')?.isAccessible).toBe(true);

    // White KL at pin 3, rotation 0
    expect(world.boards.get('KL3:0')?.isVisible).toBe(true);
    expect(world.boards.get('KL3:0')?.isAccessible).toBe(true);

    // Black KL at pin 4, rotation 0
    expect(world.boards.get('KL4:0')?.isVisible).toBe(true);
    expect(world.boards.get('KL4:0')?.isAccessible).toBe(true);

    // Other instances should be hidden
    expect(world.boards.get('QL1:0')?.isVisible).toBe(false);
    expect(world.boards.get('QL6:0')?.isVisible).toBe(false);
    expect(world.boards.get('KL1:0')?.isVisible).toBe(false);
    expect(world.boards.get('KL6:0')?.isVisible).toBe(false);
  });

  it('should maintain visibility after rotation (180°)', () => {
    // Initial: white QL at pin 1, rotation 0
    const initialTrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };
    updateInstanceVisibility(world, initialTrackStates);
    expect(world.boards.get('QL1:0')?.isVisible).toBe(true);
    expect(world.boards.get('QL1:180')?.isVisible).toBe(false);

    // Rotate: white QL at pin 1, rotation 180
    const rotatedTrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 180 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };
    updateInstanceVisibility(world, rotatedTrackStates);
    expect(world.boards.get('QL1:0')?.isVisible).toBe(false);
    expect(world.boards.get('QL1:180')?.isVisible).toBe(true);
  });

  it('should correctly map boardId to activeInstanceId to visible instance', () => {
    const trackStates = {
      QL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 0 as 0 | 180, blackRotation: 180 as 0 | 180 },
      KL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 180 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    updateInstanceVisibility(world, trackStates);

    // WQL → QL3:0
    const wqlInstance = world.boards.get('QL3:0');
    expect(wqlInstance?.isVisible).toBe(true);
    expect(wqlInstance?.isAccessible).toBe(true);

    // BQL → QL4:180
    const bqlInstance = world.boards.get('QL4:180');
    expect(bqlInstance?.isVisible).toBe(true);
    expect(bqlInstance?.isAccessible).toBe(true);

    // WKL → KL2:180
    const wklInstance = world.boards.get('KL2:180');
    expect(wklInstance?.isVisible).toBe(true);
    expect(wklInstance?.isAccessible).toBe(true);

    // BKL → KL5:0
    const bklInstance = world.boards.get('KL5:0');
    expect(bklInstance?.isVisible).toBe(true);
    expect(bklInstance?.isAccessible).toBe(true);
  });

  describe('setVisibleInstances', () => {
    it('should show only specified instances', () => {
      const instancesToShow = ['QL2:0', 'KL3:180', 'QL5:0', 'KL4:0'];
      setVisibleInstances(world, instancesToShow);

      instancesToShow.forEach(id => {
        expect(world.boards.get(id)?.isVisible).toBe(true);
        expect(world.boards.get(id)?.isAccessible).toBe(true);
      });

      // Other instances should be hidden
      expect(world.boards.get('QL1:0')?.isVisible).toBe(false);
      expect(world.boards.get('KL1:0')?.isVisible).toBe(false);
      expect(world.boards.get('QL6:0')?.isVisible).toBe(false);
      expect(world.boards.get('KL6:0')?.isVisible).toBe(false);
    });

    it('should handle cross-track instance IDs', () => {
      // WQL can be at KL pins (cross-track movement)
      const instancesToShow = ['KL2:0', 'QL3:0', 'QL6:0', 'KL5:0'];
      setVisibleInstances(world, instancesToShow);

      instancesToShow.forEach(id => {
        expect(world.boards.get(id)?.isVisible).toBe(true);
      });
    });

    it('should hide all instances before showing specified ones', () => {
      // First, show initial instances
      setVisibleInstances(world, ['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
      expect(world.boards.get('QL1:0')?.isVisible).toBe(true);

      // Then show different instances
      setVisibleInstances(world, ['QL2:0', 'KL2:0', 'QL5:0', 'KL5:0']);

      // Old instances should be hidden
      expect(world.boards.get('QL1:0')?.isVisible).toBe(false);
      expect(world.boards.get('KL1:0')?.isVisible).toBe(false);
      expect(world.boards.get('QL6:0')?.isVisible).toBe(false);
      expect(world.boards.get('KL6:0')?.isVisible).toBe(false);

      // New instances should be visible
      expect(world.boards.get('QL2:0')?.isVisible).toBe(true);
      expect(world.boards.get('KL2:0')?.isVisible).toBe(true);
      expect(world.boards.get('QL5:0')?.isVisible).toBe(true);
      expect(world.boards.get('KL5:0')?.isVisible).toBe(true);
    });
  });

  describe('showAllAttackInstances', () => {
    it('should make all attack board instances visible', () => {
      // Start with some instances visible
      setVisibleInstances(world, ['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);

      // Show all instances
      showAllAttackInstances(world);

      // Count visible instances
      let visibleCount = 0;
      world.boards.forEach((board, id) => {
        if (board.type === 'attack' && id.includes(':')) {
          expect(board.isVisible).toBe(true);
          expect(board.isAccessible).toBe(true);
          visibleCount++;
        }
      });

      // Should have all 24 instances visible (2 tracks * 6 pins * 2 rotations)
      expect(visibleCount).toBe(24);
    });
  });

  it('should not affect main board visibility', () => {
    const trackStates = {
      QL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
      KL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    // Record main board visibility before
    const mainBoardsBefore = new Map<string, boolean>();
    world.boards.forEach((board, id) => {
      if (board.type === 'main') {
        mainBoardsBefore.set(id, board.isVisible);
      }
    });

    updateInstanceVisibility(world, trackStates);

    // Check main board visibility after
    world.boards.forEach((board, id) => {
      if (board.type === 'main') {
        expect(board.isVisible).toBe(mainBoardsBefore.get(id));
      }
    });
  });
});
