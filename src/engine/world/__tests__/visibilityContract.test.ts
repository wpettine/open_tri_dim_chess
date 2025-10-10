import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import { updateInstanceVisibility } from '../visibility';
import type { TrackStates } from '../types';

describe('visibilityContract', () => {
  it('should mark exactly 4 instances visible based on trackStates', () => {
    const world = createChessWorld();
    
    const trackStates: TrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    };

    updateInstanceVisibility(world, trackStates);

    const visibleBoards = Array.from(world.boards.values()).filter(
      (board) => board.type === 'attack' && board.isVisible
    );

    expect(visibleBoards).toHaveLength(4);

    const visibleIds = visibleBoards.map((b) => b.id).sort();
    expect(visibleIds).toEqual(['KL1:0', 'KL6:0', 'QL1:0', 'QL6:0']);
  });

  it('should update visibility when trackStates change', () => {
    const world = createChessWorld();
    
    const initialStates: TrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    };

    updateInstanceVisibility(world, initialStates);

    const initialVisible = Array.from(world.boards.values()).filter(
      (board) => board.type === 'attack' && board.isVisible
    );
    expect(initialVisible).toHaveLength(4);

    const newStates: TrackStates = {
      QL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 0, blackRotation: 180 },
      KL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 180, blackRotation: 0 },
    };

    updateInstanceVisibility(world, newStates);

    const newVisible = Array.from(world.boards.values()).filter(
      (board) => board.type === 'attack' && board.isVisible
    );

    expect(newVisible).toHaveLength(4);

    const newVisibleIds = newVisible.map((b) => b.id).sort();
    expect(newVisibleIds).toEqual(['KL2:180', 'KL5:0', 'QL3:0', 'QL4:180']);
  });

  it('should hide all non-active instances', () => {
    const world = createChessWorld();
    
    const trackStates: TrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    };

    updateInstanceVisibility(world, trackStates);

    const hiddenBoards = Array.from(world.boards.values()).filter(
      (board) => board.type === 'attack' && !board.isVisible
    );

    expect(hiddenBoards.length).toBeGreaterThan(0);

    for (const board of hiddenBoards) {
      expect(board.isVisible).toBe(false);
      expect(board.isAccessible).toBe(false);
    }
  });

  it('should set isAccessible same as isVisible for active instances', () => {
    const world = createChessWorld();
    
    const trackStates: TrackStates = {
      QL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 180, blackRotation: 180 },
    };

    updateInstanceVisibility(world, trackStates);

    const visibleBoards = Array.from(world.boards.values()).filter(
      (board) => board.type === 'attack' && board.isVisible
    );

    for (const board of visibleBoards) {
      expect(board.isVisible).toBe(true);
      expect(board.isAccessible).toBe(true);
    }
  });

  it('should always keep main boards visible and accessible', () => {
    const world = createChessWorld();
    
    const trackStates: TrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    };

    updateInstanceVisibility(world, trackStates);

    const mainBoards = Array.from(world.boards.values()).filter(
      (board) => board.type === 'main'
    );

    expect(mainBoards.length).toBeGreaterThan(0);

    for (const board of mainBoards) {
      expect(board.isVisible !== false).toBe(true);
      expect(board.isAccessible !== false).toBe(true);
    }
  });
});
