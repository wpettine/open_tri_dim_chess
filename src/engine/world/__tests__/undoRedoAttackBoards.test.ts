import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createChessWorld } from '../worldBuilder';
import { createInitialPieces } from '../../initialSetup';
import { getInitialPinPositions } from '../pinPositions';
import { executeActivation } from '../worldMutation';
import type { Piece } from '../../../store/gameStore';

// Simplified GameState for testing
interface TestGameState {
  world: ReturnType<typeof createChessWorld>;
  pieces: Piece[];
  attackBoardPositions: Record<string, string>;
  attackBoardStates: Record<string, { activeInstanceId: string }>;
  currentTurn: 'white' | 'black';
  snapshots: Array<{
    pieces: Piece[];
    attackBoardPositions: Record<string, string>;
    attackBoardStates: Record<string, { activeInstanceId: string }>;
    currentTurn: 'white' | 'black';
  }>;
  moveAttackBoard: (boardId: string, toPinId: string) => void;
  undo: () => void;
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
    snapshots: [],

    moveAttackBoard: (boardId: string, toPinId: string) => {
      const state = get();
      const fromPinId = state.attackBoardPositions[boardId];
      if (!fromPinId) return;

      // Save snapshot before move
      set({
        snapshots: [
          ...state.snapshots,
          {
            pieces: state.pieces.map(p => ({ ...p })),
            attackBoardPositions: { ...state.attackBoardPositions },
            attackBoardStates: JSON.parse(JSON.stringify(state.attackBoardStates)),
            currentTurn: state.currentTurn,
          },
        ],
      });

      const result = executeActivation({
        boardId,
        fromPinId,
        toPinId,
        rotate: false,
        pieces: state.pieces,
        world: state.world,
        attackBoardPositions: state.attackBoardPositions,
      });

      const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

      set({
        pieces: result.updatedPieces,
        attackBoardPositions: result.updatedPositions,
        attackBoardStates: {
          ...state.attackBoardStates,
          [boardId]: { activeInstanceId: result.activeInstanceId },
        },
        currentTurn: nextTurn,
      });
    },

    undo: () => {
      const state = get();
      if (state.snapshots.length === 0) return;

      const snapshots = [...state.snapshots];
      const snapshot = snapshots.pop()!;

      set({
        pieces: snapshot.pieces,
        attackBoardPositions: snapshot.attackBoardPositions,
        attackBoardStates: snapshot.attackBoardStates,
        currentTurn: snapshot.currentTurn,
        snapshots,
      });
    },
  }));
}

describe('Undo/Redo with Attack Board State Restoration', () => {
  it('should restore attackBoardStates.activeInstanceId after undo', () => {
    const useStore = createTestStore();
    const initialState = useStore.getState();

    // Record initial state
    const initialActiveInstanceId = initialState.attackBoardStates.WQL.activeInstanceId;
    expect(initialActiveInstanceId).toBe('QL1:0');

    // Move WQL from QL1 to QL2
    useStore.getState().moveAttackBoard('WQL', 'QL2');
    const afterMoveState = useStore.getState();
    expect(afterMoveState.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
    expect(afterMoveState.attackBoardPositions.WQL).toBe('QL2');

    // Undo the move
    useStore.getState().undo();
    const afterUndoState = useStore.getState();

    // Verify activeInstanceId is restored
    expect(afterUndoState.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');
    expect(afterUndoState.attackBoardPositions.WQL).toBe('QL1');
  });

  it('should restore attackBoardStates.passengers after undo', () => {
    const useStore = createTestStore();
    const initialState = useStore.getState();

    // Find a white pawn on WQL
    const pawnOnWQL = initialState.pieces.find(
      p => p.level === 'WQL' && p.type === 'pawn' && p.color === 'white'
    );
    expect(pawnOnWQL).toBeDefined();

    const initialFile = pawnOnWQL!.file;
    const initialRank = pawnOnWQL!.rank;

    // Move WQL from QL1 to QL2 (should move the pawn)
    useStore.getState().moveAttackBoard('WQL', 'QL2');
    const afterMoveState = useStore.getState();

    const movedPawn = afterMoveState.pieces.find(p => p.id === pawnOnWQL!.id);
    expect(movedPawn).toBeDefined();
    expect(movedPawn!.rank).not.toBe(initialRank); // Rank should have changed

    // Undo the move
    useStore.getState().undo();
    const afterUndoState = useStore.getState();

    const restoredPawn = afterUndoState.pieces.find(p => p.id === pawnOnWQL!.id);
    expect(restoredPawn).toBeDefined();
    expect(restoredPawn!.file).toBe(initialFile);
    expect(restoredPawn!.rank).toBe(initialRank);
    expect(restoredPawn!.level).toBe('WQL');
  });

  it('should handle multiple attack board moves in undo history', () => {
    const useStore = createTestStore();

    // Move 1: WQL from QL1 to QL2
    useStore.getState().moveAttackBoard('WQL', 'QL2');
    expect(useStore.getState().attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');

    // Move 2: WKL from KL1 to KL2
    useStore.getState().moveAttackBoard('WKL', 'KL2');
    expect(useStore.getState().attackBoardStates.WKL.activeInstanceId).toBe('KL2:0');

    // Undo move 2
    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.attackBoardStates.WKL.activeInstanceId).toBe('KL1:0');
    expect(state.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0'); // Should still be at QL2

    // Undo move 1
    useStore.getState().undo();
    state = useStore.getState();
    expect(state.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');
    expect(state.attackBoardStates.WKL.activeInstanceId).toBe('KL1:0');
  });

  it('should maintain correct state for cross-track moves after undo', () => {
    const useStore = createTestStore();

    // Record initial state
    const initialState = useStore.getState();
    expect(initialState.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');

    // Move WQL from QL1 (QL track) to KL2 (KL track) - cross-track move
    useStore.getState().moveAttackBoard('WQL', 'KL2');
    const afterMoveState = useStore.getState();

    // Should use KL track for the instance ID, not QL
    expect(afterMoveState.attackBoardStates.WQL.activeInstanceId).toBe('KL2:0');
    expect(afterMoveState.attackBoardPositions.WQL).toBe('KL2');

    // Undo the cross-track move
    useStore.getState().undo();
    const afterUndoState = useStore.getState();

    // Verify it returns to QL track
    expect(afterUndoState.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');
    expect(afterUndoState.attackBoardPositions.WQL).toBe('QL1');
  });

  it('should preserve other attack boards states when undoing one board move', () => {
    const useStore = createTestStore();

    // Move WQL
    useStore.getState().moveAttackBoard('WQL', 'QL2');

    // Record other boards' states
    const wklInstanceId = useStore.getState().attackBoardStates.WKL.activeInstanceId;
    const bqlInstanceId = useStore.getState().attackBoardStates.BQL.activeInstanceId;
    const bklInstanceId = useStore.getState().attackBoardStates.BKL.activeInstanceId;

    // Undo WQL move
    useStore.getState().undo();
    const state = useStore.getState();

    // Other boards should remain unchanged
    expect(state.attackBoardStates.WKL.activeInstanceId).toBe(wklInstanceId);
    expect(state.attackBoardStates.BQL.activeInstanceId).toBe(bqlInstanceId);
    expect(state.attackBoardStates.BKL.activeInstanceId).toBe(bklInstanceId);
  });

  it('should handle undo when no snapshots exist', () => {
    const useStore = createTestStore();
    const initialState = useStore.getState();

    // Attempt undo with no moves made
    useStore.getState().undo();
    const afterUndoState = useStore.getState();

    // State should remain unchanged
    expect(afterUndoState.attackBoardStates).toEqual(initialState.attackBoardStates);
    expect(afterUndoState.attackBoardPositions).toEqual(initialState.attackBoardPositions);
  });
});
