import { describe, it, expect } from 'vitest';
import { validatePawnMove } from '../pieceMovement';
import { createChessWorld } from '../../world/worldBuilder';
import type { Piece } from '../../../store/gameStore';
import type { MoveValidationContext } from '../types';

describe('pawn transport semantics', () => {
  it('pawn with movedByAB cannot make two-square advance', () => {
    const world = createChessWorld();
    const pawn: Piece = {
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      file: 1,
      rank: 2,
      level: 'W',
      hasMoved: false,
      movedByAB: true,
    };

    const fromSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 2 && sq.boardId === 'WL'
    )!;
    
    const toSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 4 && sq.boardId === 'WL'
    )!;

    const context: MoveValidationContext = {
      piece: pawn,
      fromSquare,
      toSquare,
      allPieces: [pawn],
      world,
    };

    const result = validatePawnMove(context);
    expect(result.valid).toBe(false);
  });

  it('pawn with movedByAB can still make one-square advance', () => {
    const world = createChessWorld();
    const pawn: Piece = {
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      file: 1,
      rank: 2,
      level: 'W',
      hasMoved: false,
      movedByAB: true,
    };

    const fromSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 2 && sq.boardId === 'WL'
    )!;
    
    const toSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 3 && sq.boardId === 'NL'
    )!;

    const context: MoveValidationContext = {
      piece: pawn,
      fromSquare,
      toSquare,
      allPieces: [pawn],
      world,
    };

    const result = validatePawnMove(context);
    expect(result.valid).toBe(true);
  });

  it('pawn with movedByAB can still capture', () => {
    const world = createChessWorld();
    const pawn: Piece = {
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      file: 1,
      rank: 2,
      level: 'W',
      hasMoved: false,
      movedByAB: true,
    };

    const enemy: Piece = {
      id: 'bp1',
      type: 'pawn',
      color: 'black',
      file: 2,
      rank: 3,
      level: 'N',
      hasMoved: false,
    };

    const fromSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 2 && sq.boardId === 'WL'
    )!;
    
    const toSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 2 && sq.rank === 3 && sq.boardId === 'NL'
    )!;

    const context: MoveValidationContext = {
      piece: pawn,
      fromSquare,
      toSquare,
      allPieces: [pawn, enemy],
      world,
    };

    const result = validatePawnMove(context);
    expect(result.valid).toBe(true);
  });

  it('normal pawn without movedByAB can make two-square advance', () => {
    const world = createChessWorld();
    const pawn: Piece = {
      id: 'wp1',
      type: 'pawn',
      color: 'white',
      file: 1,
      rank: 2,
      level: 'W',
      hasMoved: false,
    };

    const fromSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 2 && sq.boardId === 'WL'
    )!;
    
    const toSquare = Array.from(world.squares.values()).find(
      sq => sq.file === 1 && sq.rank === 4 && sq.boardId === 'WL'
    )!;

    const context: MoveValidationContext = {
      piece: pawn,
      fromSquare,
      toSquare,
      allPieces: [pawn],
      world,
    };

    const result = validatePawnMove(context);
    expect(result.valid).toBe(true);
  });
});
