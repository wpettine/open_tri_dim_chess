import { describe, it, expect } from 'vitest';
import {
  validateCastle,
  getCastlingOptions,
  CastleContext,
} from '../castleValidator';
import { createChessWorld } from '../../world/worldBuilder';
import { Piece } from '../../../store/gameStore';
import { TrackStates } from '../../world/visibility';

describe('Castling Validation', () => {
  describe('Kingside Castling - QL', () => {
    it('should allow kingside castle when legal (White QL1)', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(true);
      expect(validation.kingFrom).toEqual({ file: 0, rank: 0, level: 'QL1:0' });
      expect(validation.kingTo).toEqual({ file: 1, rank: 0, level: 'QL1:0' });
      expect(validation.rookFrom).toEqual({ file: 1, rank: 0, level: 'QL1:0' });
      expect(validation.rookTo).toEqual({ file: 0, rank: 0, level: 'QL1:0' });
    });

    it('should reject if king has moved', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: true,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('King has already moved');
    });

    it('should reject if rook has moved', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: true,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Rook has already moved');
    });

    it('should reject if king is in check', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 0,
          rank: 1,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('check');
    });

    it('should reject if destination is attacked', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 1,
          rank: 1,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('attacked');
    });

    it('should reject if board not at starting pin', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 2, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 4,
          level: 'QL2:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 4,
          level: 'QL2:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not at starting position');
    });
  });

  describe('Kingside Castling - KL', () => {
    it('should allow kingside castle when legal (Black KL6)', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'black-king',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'KL6:0',
          hasMoved: false,
        },
        {
          id: 'black-rook-kl',
          type: 'rook',
          color: 'black',
          file: 5,
          rank: 9,
          level: 'KL6:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'black',
        castleType: 'kingside-kl',
        pieces,
        world,
        trackStates,
        currentTurn: 'black',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(true);
    });

    it('should reject if king is in check', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'black-king',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'KL6:0',
          hasMoved: false,
        },
        {
          id: 'black-rook-kl',
          type: 'rook',
          color: 'black',
          file: 5,
          rank: 9,
          level: 'KL6:0',
          hasMoved: false,
        },
        {
          id: 'white-queen',
          type: 'queen',
          color: 'white',
          file: 4,
          rank: 1,
          level: 'W',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'black',
        castleType: 'kingside-kl',
        pieces,
        world,
        trackStates,
        currentTurn: 'black',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('check');
    });
  });

  describe('Queenside Castling', () => {
    it('should allow queenside castle when legal (White)', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'KL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'queenside',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(true);
      expect(validation.kingFrom).toEqual({ file: 4, rank: 0, level: 'KL1:0' });
      expect(validation.kingTo).toEqual({ file: 0, rank: 0, level: 'QL1:0' });
      expect(validation.rookFrom).toEqual({ file: 0, rank: 0, level: 'QL1:0' });
      expect(validation.rookTo).toEqual({ file: 4, rank: 0, level: 'KL1:0' });
    });

    it('should reject if boards not on opposite sides', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'KL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-kl',
          type: 'rook',
          color: 'white',
          file: 5,
          rank: 0,
          level: 'KL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'queenside',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('opposite bridge boards');
    });

    it('should reject if either board not at starting pin', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 2, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 4,
          level: 'KL2:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'queenside',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not at starting positions');
    });

    it('should reject if path is attacked', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'KL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'black-rook',
          type: 'rook',
          color: 'black',
          file: 0,
          rank: 1,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'queenside',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: false,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('attacked');
    });
  });

  describe('After Attack Board Activation', () => {
    it('should reject any castle attempt after attack board activation', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const context: CastleContext = {
        color: 'white',
        castleType: 'kingside-ql',
        pieces,
        world,
        trackStates,
        currentTurn: 'white',
        attackBoardActivatedThisTurn: true,
      };

      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('attack board activation');
    });
  });

  describe('getCastlingOptions', () => {
    it('should return empty array if not current player\'s turn', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [];

      const options = getCastlingOptions('white', pieces, world, trackStates, 'black', false);
      expect(options).toEqual([]);
    });

    it('should return empty array if attack board activated this turn', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [];

      const options = getCastlingOptions('white', pieces, world, trackStates, 'white', true);
      expect(options).toEqual([]);
    });

    it('should return all valid castle types when multiple are available', () => {
      const world = createChessWorld();
      const trackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      };
      const pieces: Piece[] = [
        {
          id: 'white-king',
          type: 'king',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
        {
          id: 'white-rook-ql',
          type: 'rook',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'QL1:0',
          hasMoved: false,
        },
      ];

      const options = getCastlingOptions('white', pieces, world, trackStates, 'white', false);
      expect(options).toContain('kingside-ql');
    });
  });
});
