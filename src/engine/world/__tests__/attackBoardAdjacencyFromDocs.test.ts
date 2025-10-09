import { describe, it, expect } from 'vitest';
import { validateBoardMove } from '../worldMutation';
import type { BoardMoveContext } from '../worldMutation';
import type { Piece } from '../../../store/gameStore';
import { createChessWorld } from '../worldBuilder';
import { PIN_POSITIONS } from '../pinPositions';
import { ATTACK_BOARD_ADJACENCY, classifyDirection } from '../attackBoardAdjacency';

describe('Attack Board adjacency (engine baseline, no MD dependency)', () => {
  const mockWorld = createChessWorld();

  const allPins = Object.keys(ATTACK_BOARD_ADJACENCY);

  function positionsAvoiding(toPin: string, fromPin: string): Record<string, string> {
    const choose = (candidates: string[]) => candidates.find(p => p !== toPin && p !== fromPin) || candidates[0];
    return {
      WQL: fromPin,
      WKL: choose(['KL6', 'KL5', 'KL4', 'KL3', 'KL2', 'KL1']),
      BQL: choose(['QL6', 'QL5', 'QL4', 'QL3', 'QL2', 'QL1']),
      BKL: choose(['KL6', 'KL5', 'KL4', 'KL3', 'KL2', 'KL1']),
    };
  }

  it('for each pin, the engine allows exactly the destinations listed by ATTACK_BOARD_ADJACENCY when board is empty', () => {
    const pieces: Piece[] = [];

    for (const fromPin of allPins) {
      const allowedByEngine = new Set(ATTACK_BOARD_ADJACENCY[fromPin] ?? []);

      for (const toPin of allPins) {
        if (toPin === fromPin) continue;

        const ctx: BoardMoveContext = {
          boardId: 'WQL',
          fromPinId: fromPin,
          toPinId: toPin,
          rotate: false,
          pieces,
          world: mockWorld,
          attackBoardPositions: positionsAvoiding(toPin, fromPin),
        };

        const res = validateBoardMove(ctx);
        const expectedAllowed = allowedByEngine.has(toPin);
        expect(res.isValid).toBe(expectedAllowed);
      }
    }
  });

  it('backward-direction edges are disallowed when occupied', () => {
    for (const fromPin of allPins) {
      const pin = PIN_POSITIONS[fromPin];
      if (!pin) continue;

      const baseFile = fromPin.startsWith('QL') ? 0 : 4;
      const passenger: Piece = {
        id: 'p',
        type: 'pawn',
        color: 'white',
        file: baseFile,
        rank: pin.rankOffset / 2,
        level: 'WQL',
        hasMoved: false,
      };
      const pieces: Piece[] = [passenger];

      const neighbors = ATTACK_BOARD_ADJACENCY[fromPin] ?? [];
      for (const toPin of neighbors) {
        const dir = classifyDirection(fromPin, toPin, 'white');
        if (dir !== 'backward') continue;

        const ctx: BoardMoveContext = {
          boardId: 'WQL',
          fromPinId: fromPin,
          toPinId: toPin,
          rotate: false,
          pieces,
          world: mockWorld,
          attackBoardPositions: positionsAvoiding(toPin, fromPin),
        };

        const res = validateBoardMove(ctx);
        expect(res.isValid).toBe(false);
      }
    }
  });
});
