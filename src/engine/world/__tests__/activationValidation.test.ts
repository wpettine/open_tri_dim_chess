import { describe, it, expect } from 'vitest';
import { validateActivation } from '../../world/worldMutation';
import { createChessWorld } from '../../world/worldBuilder';
import { PIN_POSITIONS } from '../../world/pinPositions';
import type { Piece } from '../../../store/gameStore';

describe('activation validation (controller/direction)', () => {
  it('disallows backward move when occupied by white', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [];
    const boardId = 'WQL';
    const fromPinId = 'QL2';
    const toPinId = 'QL1';

    const baseRank = PIN_POSITIONS[fromPinId].rankOffset / 2;
    pieces.push({ id: 'wp1', type: 'pawn', color: 'white', file: 0, rank: baseRank, level: boardId, hasMoved: false });

    const res = validateActivation({ boardId, fromPinId, toPinId, rotate: false, pieces, world, attackBoardPositions: { WQL: fromPinId, WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' } });
    expect(res.isValid).toBe(false);
  });

  it('allows forward move when occupied by white', () => {
    const world = createChessWorld();
    const pieces: Piece[] = [];
    const boardId = 'WQL';
    const fromPinId = 'QL2';
    const toPinId = 'QL3';
    const baseRank = PIN_POSITIONS[fromPinId].rankOffset / 2;
    pieces.push({ id: 'wp1', type: 'pawn', color: 'white', file: 0, rank: baseRank, level: boardId, hasMoved: false });

    const res = validateActivation({ boardId, fromPinId, toPinId, rotate: false, pieces, world, attackBoardPositions: { WQL: fromPinId, WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' } });
    expect(res.isValid).toBe(true);
  });
});
