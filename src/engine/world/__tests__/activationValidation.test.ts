import { describe, it, expect } from 'vitest';
import { validateActivation } from '../../world/worldMutation';
import { buildInitialWorld } from '../../world/worldBuilder';
import { getInitialPieces } from '../../../store/gameStore';
import { PIN_POSITIONS } from '../../world/pinPositions';

function clonePieces(p:any[]){ return JSON.parse(JSON.stringify(p)); }

describe('activation validation (controller/direction)', () => {
  it('disallows backward move when occupied by white', () => {
    const world = buildInitialWorld();
    const pieces = clonePieces(getInitialPieces());
    const boardId = 'WQL';
    const fromPinId = 'QL2';
    const toPinId = 'QL1';

    const baseRank = PIN_POSITIONS[fromPinId].rankOffset / 2;
    pieces.push({ type: 'pawn', color: 'white', file: 0, rank: baseRank, level: boardId, hasMoved: false });

    const res = validateActivation({ boardId, fromPinId, toPinId, rotate: false, pieces, world, attackBoardPositions: { WQL: fromPinId } });
    expect(res.isValid).toBe(false);
  });

  it('allows forward move when occupied by white', () => {
    const world = buildInitialWorld();
    const pieces = clonePieces(getInitialPieces());
    const boardId = 'WQL';
    const fromPinId = 'QL2';
    const toPinId = 'QL3';
    const baseRank = PIN_POSITIONS[fromPinId].rankOffset / 2;
    pieces.push({ type: 'pawn', color: 'white', file: 0, rank: baseRank, level: boardId, hasMoved: false });

    const res = validateActivation({ boardId, fromPinId, toPinId, rotate: false, pieces, world, attackBoardPositions: { WQL: fromPinId } });
    expect(res.isValid).toBe(true);
  });
});
