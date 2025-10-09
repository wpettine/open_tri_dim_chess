import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateBoardMove } from '../worldMutation';
import type { BoardMoveContext } from '../worldMutation';
import type { Piece } from '../../../store/gameStore';
import { createChessWorld } from '../worldBuilder';
import { PIN_FOOTPRINT } from '../pinPositions';

function extractJsonFromMarkdown(md: string): string {
  const startMarker = '### Map as structured JSON';
  const startIdx = md.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find JSON section in ATTACK_BOARD_RULES.md');
  const afterStart = md.slice(startIdx + startMarker.length);
  const firstBrace = afterStart.indexOf('{');
  let depth = 0;
  let end = -1;
  for (let i = firstBrace; i < afterStart.length; i++) {
    const ch = afterStart[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (firstBrace === -1 || end === -1) throw new Error('Could not locate JSON braces block');
  return afterStart.slice(firstBrace, end + 1);
}

type DocAdjEntry = { to: string; dir: string[]; requiresEmpty: boolean };
type DocAdjacency = Record<string, DocAdjEntry[]>;

describe('Attack Board adjacency matches ATTACK_BOARD_RULES.md JSON (empty board baseline)', () => {
  const mdPath = path.resolve(__dirname, '../../../..', 'reference_docs', 'ATTACK_BOARD_RULES.md');
  const md = fs.readFileSync(mdPath, 'utf-8');
  const jsonStr = extractJsonFromMarkdown(md);
  const docAdj: DocAdjacency = JSON.parse(jsonStr);

  const mockWorld = createChessWorld();

  const allPins = Object.keys(docAdj).filter(k => /^[QK]L[1-6]$/.test(k));

  function positionsAvoiding(toPin: string, fromPin: string): Record<string, string> {
    const choose = (candidates: string[]) => candidates.find(p => p !== toPin && p !== fromPin) || candidates[0];
    return {
      WQL: fromPin,
      WKL: choose(['KL6', 'KL5', 'KL4', 'KL3', 'KL2', 'KL1']),
      BQL: choose(['QL6', 'QL5', 'QL4', 'QL3', 'QL2', 'QL1']),
      BKL: choose(['KL6', 'KL5', 'KL4', 'KL3', 'KL2', 'KL1']),
    };
  }

  it('for each pin, the engine allows exactly the destinations listed in the JSON when board is empty', () => {
    const pieces: Piece[] = [];

    for (const fromPin of allPins) {
      const allowedByDoc = new Set(docAdj[fromPin].map(e => e.to));

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
        const expectedAllowed = allowedByDoc.has(toPin);
        expect(res.isValid).toBe(expectedAllowed);
      }
    }
  });

  it('backward-only edges are disallowed when occupied (requiresEmpty=true)', () => {
    for (const fromPin of allPins) {
      const docEdges = docAdj[fromPin];

      const fp = PIN_FOOTPRINT[fromPin];
      const baseFile = fromPin.startsWith('QL') ? 0 : 4;
      const passenger: Piece = {
        id: 'p',
        type: 'pawn',
        color: 'white',
        file: baseFile,
        rank: fp.ranks[0],
        level: 'WQL',
        hasMoved: false,
      };
      const pieces: Piece[] = [passenger];

      for (const edge of docEdges) {
        const isBackwardOnly = edge.dir.length === 1 && edge.dir[0] === 'backward';
        if (!isBackwardOnly) continue;

        const ctx: BoardMoveContext = {
          boardId: 'WQL',
          fromPinId: fromPin,
          toPinId: edge.to,
          rotate: false,
          pieces,
          world: mockWorld,
          attackBoardPositions: positionsAvoiding(edge.to, fromPin),
        };

        const res = validateBoardMove(ctx);
        expect(res.isValid).toBe(false);
      }
    }
  });
});
