import { describe, it, expect } from 'vitest';
import { validateBoardMove } from '../validator';
import { createChessWorld } from '../../world/worldBuilder';
import { PieceState } from '../../movement/types';

describe('Attack Board Movement Validator', () => {
  const world = createChessWorld();

  it('should allow valid adjacent move for empty board', () => {
    const pieces: PieceState[] = [];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL2',
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject non-adjacent pins', () => {
    const pieces: PieceState[] = [];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL6',
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not adjacent');
  });

  it('should reject if board has 2+ pieces', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
      { id: 'p2', type: 'knight', color: 'white', squareId: 'a0WQL', hasMoved: false },
    ];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL2',
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('more than 1 piece');
  });

  it('should reject backward move for occupied board', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
    ];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL2',
      toPinId: 'QL1', // Backward
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('backward');
  });

  it('should allow backward move for empty board (inverted)', () => {
    const pieces: PieceState[] = [];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL2',
      toPinId: 'QL1', // Backward, but empty board
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(true);
  });

  it('should allow cross-side movement', () => {
    const pieces: PieceState[] = [];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'KL1', // Cross-side
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject if player does not control board', () => {
    // Black piece on white board = black controls
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'black', squareId: 'z0WQL', hasMoved: false },
    ];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL2',
      pieces,
      world,
      currentTurn: 'white', // White's turn, but black controls
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('do not control');
  });

  it('should reject if blocked by vertical shadow', () => {
    // Place non-knight piece below target pin
    // QL2 covers files 0-1, ranks 2-3. Use a2W (file 1, rank 2) which exists
    const pieces: PieceState[] = [
      { id: 'r1', type: 'rook', color: 'white', squareId: 'a2W', hasMoved: false },
    ];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL2', // QL2 covers files 0-1, ranks 2-3
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Vertical Shadow');
  });

  it('should allow if knight is below (knights exempt)', () => {
    const pieces: PieceState[] = [
      { id: 'n1', type: 'knight', color: 'white', squareId: 'a2W', hasMoved: false },
    ];
    const result = validateBoardMove({
      boardId: 'WQL',
      fromPinId: 'QL1',
      toPinId: 'QL2',
      pieces,
      world,
      currentTurn: 'white',
    });
    expect(result.valid).toBe(true);
  });
});
