import { describe, it, expect } from 'vitest';
import { executeActivation } from '../worldMutation';
import { createChessWorld } from '../../worldBuilder';
import type { Piece } from '../../../store/gameStore';

describe('executeActivation arrivalChoice', () => {
  function mkPiece(overrides: Partial<Piece>): Piece {
    return {
      id: 'P1',
      type: 'pawn',
      color: 'white',
      file: 0,
      rank: 0,
      level: 'WQL',
      hasMoved: false,
      ...overrides,
    };
  }

  it('maps passenger with identity (translate only) when rotate=false and arrivalChoice=identity', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [
      mkPiece({ file: 0, rank: 0, level: 'WQL' }),
    ];
    const res = executeActivation({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL3',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      arrivalChoice: 'identity',
    });
    const moved = res.updatedPieces.find(p => p.id === 'P1')!;
    expect(moved.file).toBe(0);
    expect(moved.rank).toBe(2);
    expect(moved.level).toBe('WQL');
    expect(moved.movedByAB).toBe(true);
    expect(moved.hasMoved).toBe(true);
  });

  it('maps passenger with rot180 when rotate=false and arrivalChoice=rot180', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [
      mkPiece({ file: 0, rank: 0, level: 'WQL' }),
    ];
    const res = executeActivation({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL3',
      rotate: false,
      pieces,
      world,
      attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      arrivalChoice: 'rot180',
    });
    const moved = res.updatedPieces.find(p => p.id === 'P1')!;
    expect(moved.file).toBe(1);
    expect(moved.rank).toBe(3);
    expect(moved.level).toBe('WQL');
    expect(moved.movedByAB).toBe(true);
    expect(moved.hasMoved).toBe(true);
  });
});
