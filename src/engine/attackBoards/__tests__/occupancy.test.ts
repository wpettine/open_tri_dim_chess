import { describe, it, expect } from 'vitest';
import { getPiecesOnBoard, countPiecesOnBoard, canBoardMove, getBoardController } from '../occupancy';
import { createChessWorld } from '../../world/worldBuilder';
import { PieceState } from '../../movement/types';

describe('Attack Board Occupancy', () => {
  const world = createChessWorld();

  it('should count pieces on attack board correctly', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
      { id: 'p2', type: 'knight', color: 'white', squareId: 'a0WQL', hasMoved: false },
    ];

    const count = countPiecesOnBoard('WQL', pieces, world);
    expect(count).toBe(2);
  });

  it('should return true for board with 0 pieces', () => {
    const pieces: PieceState[] = [];
    expect(canBoardMove('WQL', pieces, world)).toBe(true);
  });

  it('should return true for board with 1 piece', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
    ];
    expect(canBoardMove('WQL', pieces, world)).toBe(true);
  });

  it('should return false for board with 2+ pieces', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
      { id: 'p2', type: 'knight', color: 'white', squareId: 'a0WQL', hasMoved: false },
    ];
    expect(canBoardMove('WQL', pieces, world)).toBe(false);
  });

  it('should return original owner for empty board', () => {
    const pieces: PieceState[] = [];
    const controller = getBoardController('WQL', pieces, world, 'white');
    expect(controller).toBe('white');
  });

  it('should return hijacker color for board with 1 enemy piece', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'black', squareId: 'z0WQL', hasMoved: false },
    ];
    const controller = getBoardController('WQL', pieces, world, 'white');
    expect(controller).toBe('black'); // Hijacked!
  });

  it('should return null for contested board (2+ pieces)', () => {
    const pieces: PieceState[] = [
      { id: 'p1', type: 'pawn', color: 'white', squareId: 'z0WQL', hasMoved: false },
      { id: 'p2', type: 'knight', color: 'black', squareId: 'a0WQL', hasMoved: false },
    ];
    const controller = getBoardController('WQL', pieces, world, 'white');
    expect(controller).toBeNull(); // Contested
  });
});
