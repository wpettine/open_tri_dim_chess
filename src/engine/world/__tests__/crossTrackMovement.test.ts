import { describe, it, expect } from 'vitest';
import { executeActivation, validateActivation } from '../worldMutation';
import { createChessWorld } from '../worldBuilder';
import type { Piece } from '../../../store/gameStore';

describe('cross-track attack board movement', () => {
  function mkPiece(overrides: Partial<Piece>): Piece {
    return {
      id: 'P1',
      type: 'pawn',
      color: 'white',
      file: 0,
      rank: 1,
      level: 'WQL',
      hasMoved: false,
      ...overrides,
    };
  }

  it('allows WQL to move from QL1 to KL2', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 0, rank: 1, level: 'WQL' })];

    const result = validateActivation({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'KL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    expect(result.isValid).toBe(true);
  });

  it('creates correct activeInstanceId for cross-track move (QL to KL)', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 0, rank: 1, level: 'WQL' })];

    const result = executeActivation({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'KL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    // Should use destination pin's track (KL), not board's inherent track (QL)
    expect(result.activeInstanceId).toBe('KL2:0');
  });

  it('remaps passenger to KL file range when moving from QL to KL', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 0, rank: 1, level: 'WQL' })];

    const result = executeActivation({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'KL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    const passenger = result.updatedPieces.find(p => p.id === 'P1')!;
    // Should move to KL file range (4-5), not stay in QL range (0-1)
    expect(passenger.file).toBeGreaterThanOrEqual(4);
    expect(passenger.file).toBeLessThanOrEqual(5);
  });

  it('allows WKL to move from KL1 to QL2', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 4, rank: 1, level: 'WKL' })];

    const result = validateActivation({
      boardId: 'WKL',
      fromPinId: 'KL1',
      toPinId: 'QL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    expect(result.isValid).toBe(true);
  });

  it('creates correct activeInstanceId for cross-track move (KL to QL)', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 4, rank: 1, level: 'WKL' })];

    const result = executeActivation({
      boardId: 'WKL',
      fromPinId: 'KL1',
      toPinId: 'QL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    // Should use destination pin's track (QL), not board's inherent track (KL)
    expect(result.activeInstanceId).toBe('QL2:0');
  });

  it('remaps passenger to QL file range when moving from KL to QL', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [mkPiece({ file: 4, rank: 1, level: 'WKL' })];

    const result = executeActivation({
      boardId: 'WKL',
      fromPinId: 'KL1',
      toPinId: 'QL2',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
    });

    const passenger = result.updatedPieces.find(p => p.id === 'P1')!;
    // Should move to QL file range (0-1), not stay in KL range (4-5)
    expect(passenger.file).toBeGreaterThanOrEqual(0);
    expect(passenger.file).toBeLessThanOrEqual(1);
  });
});
