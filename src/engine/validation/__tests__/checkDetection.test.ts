import { describe, it, expect } from 'vitest';
import {
  isSquareAttacked,
  isInCheck,
  getLegalMovesAvoidingCheck,
  isCheckmate,
  isStalemate,
} from '../checkDetection';
import { createChessWorld } from '../../world/worldBuilder';
import { Piece } from '../../../store/gameStore';

describe('checkDetection', () => {
  describe('isSquareAttacked', () => {
    it('should detect when a square is attacked by an enemy piece', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const targetSquare = world.squares.get('a4W')!;
      const result = isSquareAttacked(targetSquare, 'white', world, pieces);

      expect(result).toBe(true);
    });

    it('should return false when square is not attacked', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-rook',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const targetSquare = world.squares.get('c3W')!;
      const result = isSquareAttacked(targetSquare, 'white', world, pieces);

      expect(result).toBe(false);
    });

    it('should detect diagonal attack by bishop', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'black-bishop',
          type: 'bishop',
          color: 'black',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const targetSquare = world.squares.get('d4W')!;
      const result = isSquareAttacked(targetSquare, 'black', world, pieces);

      expect(result).toBe(true);
    });
  });

  describe('isInCheck', () => {
    it('should detect when king is in check from a rook', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 2,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isInCheck('white', world, pieces);

      expect(result).toBe(true);
    });

    it('should return false when king is not in check', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 3,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isInCheck('white', world, pieces);

      expect(result).toBe(false);
    });

    it('should detect check from a knight', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'black-king',
          type: 'king',
          color: 'black',
          file: 3,
          rank: 4,
          level: 'N',
          hasMoved: false,
        },
        {
          id: 'white-knight',
          type: 'knight',
          color: 'white',
          file: 1,
          rank: 3,
          level: 'N',
          hasMoved: false,
        },
      ];

      const result = isInCheck('black', world, pieces);

      expect(result).toBe(true);
    });
  });

  describe('getLegalMovesAvoidingCheck', () => {
    it('should filter out moves that leave king in check', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-bishop',
          type: 'bishop',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 2,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const legalMoves = getLegalMovesAvoidingCheck(
        pieces[1],
        world,
        pieces
      );

      expect(legalMoves.length).toBeGreaterThan(0);
      legalMoves.forEach((move) => {
        expect(move.startsWith('b')).toBe(true);
      });
    });

    it('should allow all moves when piece is not pinned', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-rook',
          type: 'rook',
          color: 'white',
          file: 3,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const legalMoves = getLegalMovesAvoidingCheck(
        pieces[1],
        world,
        pieces
      );

      expect(legalMoves.length).toBeGreaterThan(5);
    });

    it('should allow king to move out of check', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 2,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const legalMoves = getLegalMovesAvoidingCheck(
        pieces[0],
        world,
        pieces
      );

      expect(legalMoves.length).toBeGreaterThan(0);
      const movesOffFileB = legalMoves.filter((move) => !move.startsWith('b'));
      expect(movesOffFileB.length).toBeGreaterThan(0);
    });
  });

  describe('isCheckmate', () => {
    it('should return false when king can escape', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 2,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isCheckmate('white', world, pieces);

      expect(result).toBe(false);
    });

    it('should return false when not in check', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 4,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isCheckmate('white', world, pieces);

      expect(result).toBe(false);
    });
  });

  describe('isStalemate', () => {
    it('should return false when player has legal moves', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-pawn',
          type: 'pawn',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isStalemate('white', world, pieces);

      expect(result).toBe(false);
    });

    it('should return false when in check', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 2,
          rank: 4,
          level: 'W',
          hasMoved: false,
        },
      ];

      const result = isStalemate('white', world, pieces);

      expect(result).toBe(false);
    });
  });
});
