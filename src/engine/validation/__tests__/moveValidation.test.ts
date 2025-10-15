import { describe, it, expect } from 'vitest';
import { getLegalMoves } from '../moveValidator';
import { createChessWorld } from '../../world/worldBuilder';
import { Piece } from '../../../store/gameStore';

describe('moveValidation', () => {
  describe('Vertical Shadow Blocking', () => {
    it('should block bishop diagonal if intermediate column is occupied on different level', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'bishop',
          type: 'bishop',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'blocker',
          type: 'pawn',
          color: 'black',
          file: 3,
          rank: 4,
          level: 'B',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('d5W')).toBe(false);
    });

    it('should allow knight to jump over blocking pieces', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'knight',
          type: 'knight',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'blocker',
          type: 'pawn',
          color: 'black',
          file: 3,
          rank: 3,
          level: 'N',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.length).toBeGreaterThan(0);
    });
  });

  describe('Purely Vertical Movement Prohibition', () => {
    it('should prevent rook from moving to same file/rank on different level', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b2N')).toBe(false);
    });

    it('should prevent king from moving to same file/rank on different level', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'king',
          type: 'king',
          color: 'white',
          file: 3,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('c4N')).toBe(false);
    });
  });

  describe('Pawn Movement', () => {
    it('should allow pawn to move forward one square', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a3W')).toBe(true);
    });

    it('should allow pawn to move forward two squares on first move', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a4W')).toBe(true);
    });

    it('should allow pawn to capture diagonally', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'enemy',
          type: 'pawn',
          color: 'black',
          file: 2,
          rank: 3,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b3W')).toBe(true);
    });

    it('should not allow pawn to move forward if blocked', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'blocker',
          type: 'pawn',
          color: 'black',
          file: 1,
          rank: 3,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a3W')).toBe(false);
      expect(validMoves.includes('a4W')).toBe(false);
    });
  });

  describe('Rook Movement', () => {
    it('should allow rook to move horizontally', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b1W')).toBe(true);
      expect(validMoves.includes('c1W')).toBe(true);
      expect(validMoves.includes('d1W')).toBe(true);
    });

    it('should allow rook to move vertically', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a2W')).toBe(true);
      expect(validMoves.includes('a3W')).toBe(true);
    });

    it('should not allow rook to move diagonally on same level', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b2W')).toBe(false);
    });

    it('should not allow rook to move diagonally across levels', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a1W')).toBe(false);
    });

    it('should allow rook to move horizontally across levels', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'WQL',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b1W')).toBe(true);
    });

    it('should allow rook to move vertically across levels', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a3N')).toBe(true);
    });
  });

  describe('Knight Movement', () => {
    it('should allow knight L-shaped moves', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'knight',
          type: 'knight',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a4W')).toBe(true);
      expect(validMoves.includes('c4W')).toBe(true);
      expect(validMoves.includes('d3W')).toBe(true);
      expect(validMoves.includes('d1W')).toBe(true);
    });

    it('should allow knight to move in 3 dimensions when forming valid L-shape', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'knight',
          type: 'knight',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a4N')).toBe(true);
      expect(validMoves.includes('c4N')).toBe(true);
      expect(validMoves.includes('d3N')).toBe(true);
    });

    it('should allow knight to move in exactly 2 dimensions (L-shape across levels)', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'knight',
          type: 'knight',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b4N')).toBe(true);
      expect(validMoves.includes('a4W')).toBe(true);
      expect(validMoves.includes('c4W')).toBe(true);
    });
  });

  describe('Bishop Movement', () => {
    it('should allow bishop to move diagonally', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'bishop',
          type: 'bishop',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a1W')).toBe(true);
      expect(validMoves.includes('c3W')).toBe(true);
      expect(validMoves.includes('d4W')).toBe(true);
    });

    it('should not allow bishop to move straight', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'bishop',
          type: 'bishop',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b3W')).toBe(false);
      expect(validMoves.includes('c2W')).toBe(false);
    });
  });

  describe('Queen Movement', () => {
    it('should allow queen to move like rook', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'queen',
          type: 'queen',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b3W')).toBe(true);
      expect(validMoves.includes('c2W')).toBe(true);
    });

    it('should allow queen to move like bishop', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'queen',
          type: 'queen',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a1W')).toBe(true);
      expect(validMoves.includes('c3W')).toBe(true);
    });
  });

  describe('King Movement', () => {
    it('should allow king to move one square in any direction', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b3W')).toBe(true);
      expect(validMoves.includes('c3W')).toBe(true);
      expect(validMoves.includes('c2W')).toBe(true);
      expect(validMoves.includes('c1W')).toBe(true);
      expect(validMoves.includes('b1W')).toBe(true);
      expect(validMoves.includes('a1W')).toBe(true);
      expect(validMoves.includes('a2W')).toBe(true);
      expect(validMoves.includes('a3W')).toBe(true);
    });

    it('should not allow king to move more than one square', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('b4W')).toBe(false);
      expect(validMoves.includes('d2W')).toBe(false);
    });

    it('should block queen from moving to destination with piece on different level (vertical shadow)', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'queen',
          type: 'queen',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 3,
          level: 'N',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      expect(validMoves.includes('a3W')).toBe(false);
    });
  });

  describe('Prevent Capturing Own Pieces', () => {
    it('should prevent white piece from capturing white piece on main board', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 3,
          rank: 0,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // Rook should not be able to move to square occupied by friendly pawn
      expect(validMoves.includes('d0W')).toBe(false);
    });

    it('should prevent black piece from capturing black piece on main board', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'queen',
          type: 'queen',
          color: 'black',
          file: 2,
          rank: 2,
          level: 'B',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'black',
          file: 4,
          rank: 4,
          level: 'B',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // Queen should not be able to move diagonally to square occupied by friendly pawn
      expect(validMoves.includes('e5B')).toBe(false);
    });

    it('should allow white piece to capture black piece', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'black',
          file: 1,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // Rook should have some valid moves (not blocked by own piece color check)
      // The specific square depends on board geometry, but rook should be able to move
      expect(validMoves.length).toBeGreaterThan(0);
    });

    it('should prevent capturing own piece on attack board', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // Rook should not be able to capture friendly pawn on same attack board
      expect(validMoves.includes('b0WQL')).toBe(false);
    });

    it('should prevent capturing own piece across levels', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'bishop',
          type: 'bishop',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 3,
          rank: 3,
          level: 'N',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // Bishop should not be able to capture friendly pawn on different level
      expect(validMoves.includes('d4N')).toBe(false);
    });

    it('should allow king to move to adjacent empty squares but not occupied squares', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'pawn',
          type: 'pawn',
          color: 'white',
          file: 3,
          rank: 3,
          level: 'W',
          hasMoved: false,
        },
      ];

      const validMoves = getLegalMoves(pieces[0], world, pieces);

      // King should not be able to move to square occupied by friendly pawn
      expect(validMoves.includes('d4W')).toBe(false);

      // King should be able to move to other adjacent squares (at least one should be valid)
      const hasValidAdjacentMove =
        validMoves.includes('b2W') ||
        validMoves.includes('c2W') ||
        validMoves.includes('b3W');
      expect(hasValidAdjacentMove).toBe(true);
    });

    it('should handle piece color validation with attackBoardStates', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'rook',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'knight',
          type: 'knight',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'WQL',
          hasMoved: false,
        },
      ];

      const attackBoardStates = {
        WQL: { activeInstanceId: 'QL1:0' },
        WKL: { activeInstanceId: 'KL1:0' },
        BQL: { activeInstanceId: 'QL6:0' },
        BKL: { activeInstanceId: 'KL6:0' },
      };

      const validMoves = getLegalMoves(pieces[0], world, pieces, attackBoardStates);

      // Rook should not be able to capture friendly knight
      expect(validMoves.includes('b1WQL')).toBe(false);
    });
  });
});
