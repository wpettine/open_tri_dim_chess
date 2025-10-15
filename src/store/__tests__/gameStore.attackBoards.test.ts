import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createChessWorld } from '../../engine/world/worldBuilder';
import { createInitialPieces } from '../../engine/initialSetup';
import { getInitialPinPositions } from '../../engine/world/pinPositions';
import { executeActivation, validateActivation } from '../../engine/world/worldMutation';
import { setVisibleInstances } from '../../engine/world/visibility';
import type { Piece } from '../gameStore';
import type { ChessWorld } from '../../engine/world/types';

interface TestGameState {
  world: ChessWorld;
  pieces: Piece[];
  attackBoardPositions: Record<string, string>;
  attackBoardStates: Record<string, { activeInstanceId: string }>;
  currentTurn: 'white' | 'black';
  moveHistory: Array<{ type: 'board-move'; boardId: string; from: string; to: string }>;

  moveAttackBoard: (boardId: string, toPinId: string, rotate?: boolean, arrivalChoice?: 'identity' | 'rot180') => void;
}

function createTestStore() {
  return create<TestGameState>()((set, get) => ({
    world: createChessWorld(),
    pieces: createInitialPieces(),
    attackBoardPositions: getInitialPinPositions(),
    attackBoardStates: {
      WQL: { activeInstanceId: 'QL1:0' },
      WKL: { activeInstanceId: 'KL1:0' },
      BQL: { activeInstanceId: 'QL6:0' },
      BKL: { activeInstanceId: 'KL6:0' },
    },
    currentTurn: 'white',
    moveHistory: [],

    moveAttackBoard: (boardId: string, toPinId: string, rotate = false, arrivalChoice?: 'identity' | 'rot180') => {
      const state = get();
      const fromPinId = state.attackBoardPositions[boardId];
      if (!fromPinId) return;

      const validation = validateActivation({
        boardId,
        fromPinId,
        toPinId,
        rotate,
        pieces: state.pieces,
        world: state.world,
        attackBoardPositions: state.attackBoardPositions,
      });

      if (!validation.isValid) return;

      const result = executeActivation({
        boardId,
        fromPinId,
        toPinId,
        rotate,
        pieces: state.pieces,
        world: state.world,
        attackBoardPositions: state.attackBoardPositions,
        arrivalChoice,
      });

      const move = {
        type: 'board-move' as const,
        boardId,
        from: fromPinId,
        to: toPinId,
      };

      const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

      const newAttackBoardStates = {
        ...state.attackBoardStates,
        [boardId]: {
          activeInstanceId: result.activeInstanceId,
        },
      };

      const instancesToShow = [
        newAttackBoardStates.WQL?.activeInstanceId,
        newAttackBoardStates.WKL?.activeInstanceId,
        newAttackBoardStates.BQL?.activeInstanceId,
        newAttackBoardStates.BKL?.activeInstanceId,
      ].filter(Boolean) as string[];

      setVisibleInstances(state.world, instancesToShow);

      set({
        world: { ...state.world },
        pieces: result.updatedPieces,
        attackBoardPositions: result.updatedPositions,
        attackBoardStates: newAttackBoardStates,
        moveHistory: [...state.moveHistory, move],
        currentTurn: nextTurn,
      });
    },
  }));
}

describe('moveAttackBoard() Integration Tests', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useStore = createTestStore();
  });

  it('should update attackBoardStates.activeInstanceId', () => {
    const initialState = useStore.getState();
    expect(initialState.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    expect(afterState.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
  });

  it('should update attackBoardPositions', () => {
    const initialState = useStore.getState();
    expect(initialState.attackBoardPositions.WQL).toBe('QL1');

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    expect(afterState.attackBoardPositions.WQL).toBe('QL2');
  });

  it('should update passenger pieces coordinates', () => {
    const initialState = useStore.getState();
    const pawnOnWQL = initialState.pieces.find(
      p => p.level === 'WQL' && p.type === 'pawn' && p.color === 'white'
    );
    expect(pawnOnWQL).toBeDefined();

    const initialRank = pawnOnWQL!.rank;

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    const movedPawn = afterState.pieces.find(p => p.id === pawnOnWQL!.id);

    // Pin 1 has rank offset 0, pin 2 has rank offset 4, so rank should increase
    expect(movedPawn!.rank).not.toBe(initialRank);
    expect(movedPawn!.rank).toBeGreaterThan(initialRank);
  });

  it('should remap passenger coordinates to destination track for cross-track moves', () => {
    const initialState = useStore.getState();
    const pawnOnWQL = initialState.pieces.find(
      p => p.level === 'WQL' && p.type === 'pawn' && p.color === 'white'
    );
    expect(pawnOnWQL).toBeDefined();
    expect(pawnOnWQL!.file).toBeGreaterThanOrEqual(0);
    expect(pawnOnWQL!.file).toBeLessThanOrEqual(1); // QL track: files 0-1

    // Move WQL from QL1 to KL2 (cross-track)
    useStore.getState().moveAttackBoard('WQL', 'KL2');

    const afterState = useStore.getState();
    const movedPawn = afterState.pieces.find(p => p.id === pawnOnWQL!.id);

    // Should now be in KL file range (4-5)
    expect(movedPawn!.file).toBeGreaterThanOrEqual(4);
    expect(movedPawn!.file).toBeLessThanOrEqual(5);
  });

  it('should update visibility to show new instance', () => {
    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const state = useStore.getState();

    // New instance should be visible
    const newInstance = state.world.boards.get('QL2:0');
    expect(newInstance?.isVisible).toBe(true);
    expect(newInstance?.isAccessible).toBe(true);

    // Old instance should be hidden
    const oldInstance = state.world.boards.get('QL1:0');
    expect(oldInstance?.isVisible).toBe(false);
  });

  it('should add move to history', () => {
    const initialState = useStore.getState();
    expect(initialState.moveHistory).toHaveLength(0);

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    expect(afterState.moveHistory).toHaveLength(1);
    expect(afterState.moveHistory[0]).toEqual({
      type: 'board-move',
      boardId: 'WQL',
      from: 'QL1',
      to: 'QL2',
    });
  });

  it('should switch turn after move', () => {
    const initialState = useStore.getState();
    expect(initialState.currentTurn).toBe('white');

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    expect(afterState.currentTurn).toBe('black');
  });

  it('should preserve other attack boards states unchanged', () => {
    const initialState = useStore.getState();
    const wklInitialState = initialState.attackBoardStates.WKL;
    const bqlInitialState = initialState.attackBoardStates.BQL;
    const bklInitialState = initialState.attackBoardStates.BKL;

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    expect(afterState.attackBoardStates.WKL).toEqual(wklInitialState);
    expect(afterState.attackBoardStates.BQL).toEqual(bqlInitialState);
    expect(afterState.attackBoardStates.BKL).toEqual(bklInitialState);
  });

  it('should handle rotation (0° vs 180°) correctly', () => {
    const initialState = useStore.getState();
    expect(initialState.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');
    expect(initialState.currentTurn).toBe('white');

    // Clear all pieces from WQL to allow rotation
    const clearedPieces = initialState.pieces.filter(p => p.level !== 'WQL');
    useStore.setState({ pieces: clearedPieces });

    // Move WQL to QL2 (white's turn)
    useStore.getState().moveAttackBoard('WQL', 'QL2');
    expect(useStore.getState().attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
    expect(useStore.getState().currentTurn).toBe('black');

    // Move BQL (black's turn)
    useStore.getState().moveAttackBoard('BQL', 'QL5');
    expect(useStore.getState().currentTurn).toBe('white');

    // Rotate WQL at QL2 (white's turn)
    useStore.getState().moveAttackBoard('WQL', 'QL2', true);

    const afterState = useStore.getState();
    // After rotating at QL2, instance should be QL2:180
    expect(afterState.attackBoardStates.WQL.activeInstanceId).toBe('QL2:180');
  });

  it('should use destination pin track for cross-track move instance ID', () => {
    useStore.getState().moveAttackBoard('WQL', 'KL2');

    const state = useStore.getState();
    // WQL moved to KL2, so instance should use KL track
    expect(state.attackBoardStates.WQL.activeInstanceId).toBe('KL2:0');
  });

  it('should not execute invalid moves', () => {
    const initialState = useStore.getState();

    // Try to move to an invalid pin (not adjacent)
    useStore.getState().moveAttackBoard('WQL', 'QL6');

    const afterState = useStore.getState();

    // State should remain unchanged
    expect(afterState.attackBoardStates.WQL).toEqual(initialState.attackBoardStates.WQL);
    expect(afterState.attackBoardPositions.WQL).toEqual(initialState.attackBoardPositions.WQL);
    expect(afterState.moveHistory).toHaveLength(0);
  });

  it('should handle arrivalChoice parameter for passenger positioning', () => {
    const initialState = useStore.getState();
    const pawnOnWQL = initialState.pieces.find(
      p => p.level === 'WQL' && p.type === 'pawn' && p.color === 'white'
    );
    expect(pawnOnWQL).toBeDefined();

    // Move with identity arrival
    useStore.getState().moveAttackBoard('WQL', 'QL2', false, 'identity');

    const afterState = useStore.getState();
    const movedPawn = afterState.pieces.find(p => p.id === pawnOnWQL!.id);

    expect(movedPawn).toBeDefined();
    expect(movedPawn!.level).toBe('WQL');
  });

  it('should maintain visibility of all 4 active attack boards', () => {
    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const state = useStore.getState();

    const visibleInstances: string[] = [];
    state.world.boards.forEach((board, id) => {
      if (board.type === 'attack' && board.isVisible && id.includes(':')) {
        visibleInstances.push(id);
      }
    });

    // Should still have exactly 4 visible instances
    expect(visibleInstances).toHaveLength(4);
    expect(visibleInstances).toContain('QL2:0'); // WQL moved here
    expect(visibleInstances).toContain('KL1:0'); // WKL unchanged
    expect(visibleInstances).toContain('QL6:0'); // BQL unchanged
    expect(visibleInstances).toContain('KL6:0'); // BKL unchanged
  });

  it('should update world reference to trigger Zustand re-render', () => {
    const initialState = useStore.getState();
    const initialWorldRef = initialState.world;

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();
    const afterWorldRef = afterState.world;

    // World reference should change (shallow copy)
    expect(afterWorldRef).not.toBe(initialWorldRef);
  });

  it('should handle multiple sequential moves correctly', () => {
    // Move 1: WQL from QL1 to QL2
    useStore.getState().moveAttackBoard('WQL', 'QL2');
    let state = useStore.getState();
    expect(state.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
    expect(state.currentTurn).toBe('black');

    // Move 2: BQL from QL6 to QL5
    useStore.getState().moveAttackBoard('BQL', 'QL5');
    state = useStore.getState();
    expect(state.attackBoardStates.BQL.activeInstanceId).toBe('QL5:0');
    expect(state.currentTurn).toBe('white');

    // Both moves should be in history
    expect(state.moveHistory).toHaveLength(2);
    expect(state.moveHistory[0].boardId).toBe('WQL');
    expect(state.moveHistory[1].boardId).toBe('BQL');
  });

  it('should correctly orchestrate all state updates in single move', () => {
    const initialState = useStore.getState();

    useStore.getState().moveAttackBoard('WQL', 'QL2');

    const afterState = useStore.getState();

    // Verify all state updates happened together
    expect(afterState.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
    expect(afterState.attackBoardPositions.WQL).toBe('QL2');
    expect(afterState.moveHistory).toHaveLength(1);
    expect(afterState.currentTurn).toBe('black');
    expect(afterState.world.boards.get('QL2:0')?.isVisible).toBe(true);
    expect(afterState.world.boards.get('QL1:0')?.isVisible).toBe(false);

    // Verify passengers were moved
    const movedPassengers = afterState.pieces.filter(p => p.level === 'WQL');
    movedPassengers.forEach(passenger => {
      const initialPassenger = initialState.pieces.find(p => p.id === passenger.id);
      // Coordinates should have changed
      expect(passenger.rank).not.toBe(initialPassenger!.rank);
    });
  });
});
