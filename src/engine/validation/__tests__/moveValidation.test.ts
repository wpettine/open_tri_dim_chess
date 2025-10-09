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
          level: 'WQL_QL1',
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
          level: 'WQL_QL1',
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
});
