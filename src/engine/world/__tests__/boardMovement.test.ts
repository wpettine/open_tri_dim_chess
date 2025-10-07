import { describe, it, expect } from 'vitest';
import { validateBoardMove, executeBoardMove } from '../worldMutation';
import type { BoardMoveContext } from '../worldMutation';
import type { Piece } from '../../../store/gameStore';
import { createChessWorld } from '../worldBuilder';

describe('Board Movement Validation', () => {
  const mockWorld = createChessWorld();
  const basePieces: Piece[] = [];
  const basePositions = {
    WQL: 'QL1',
    WKL: 'KL1',
    BQL: 'QL6',
    BKL: 'KL6',
  };

  describe('Adjacency Validation', () => {
    it('should allow movement to adjacent pin in same line', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should allow movement to adjacent pin in different line', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'KL1',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject movement to non-adjacent pin', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL4',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not adjacent');
    });
  });

  describe('Occupancy Validation', () => {
    it('should reject movement to occupied pin', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'KL1',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WKL: 'KL1',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('occupied');
    });

    it('should allow movement to unoccupied pin', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WKL: 'KL3',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Direction Validation', () => {
    it('should allow forward movement (increasing level)', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should allow sideways movement between lines', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL2',
        toPinId: 'KL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject backward movement from non-inverted pin', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL2',
        toPinId: 'QL1',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WQL: 'QL2',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('backward');
    });

    it('should allow backward movement from inverted pin', () => {
      const context: BoardMoveContext = {
        boardId: 'BQL',
        fromPinId: 'QL6',
        toPinId: 'QL5',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject sideways movement within same line', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL2',
        toPinId: 'QL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WQL: 'QL2',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Vertical Shadow Validation', () => {
    it('should allow movement when no blocking pieces exist', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL3',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject movement when non-knight piece blocks path', () => {
      const blockingPiece: Piece = {
        id: 'blocking-rook',
        type: 'rook',
        color: 'white',
        file: 0,
        rank: 0,
        level: '1',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL3',
        rotate: false,
        pieces: [blockingPiece],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('shadow');
    });

    it('should allow movement when knight passenger exists', () => {
      const knightPassenger: Piece = {
        id: 'knight-passenger',
        type: 'knight',
        color: 'white',
        file: 0,
        rank: 0,
        level: '0',
        hasMoved: false,
      };

      const blockingPiece: Piece = {
        id: 'blocking-rook',
        type: 'rook',
        color: 'white',
        file: 0,
        rank: 0,
        level: '1',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL3',
        rotate: false,
        pieces: [knightPassenger, blockingPiece],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should allow single-level movement without shadow check', () => {
      const blockingPiece: Piece = {
        id: 'blocking-rook',
        type: 'rook',
        color: 'white',
        file: 0,
        rank: 0,
        level: '1',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: [blockingPiece],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Board Move Execution', () => {
    it('should update board position', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = executeBoardMove(context);
      expect(result.updatedPositions.WQL).toBe('QL2');
    });

    it('should update passenger piece coordinates', () => {
      const passenger: Piece = {
        id: 'passenger-pawn',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: '0',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: [passenger],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = executeBoardMove(context);
      const updatedPassenger = result.updatedPieces.find(p => p.id === 'passenger-pawn');
      
      expect(updatedPassenger?.file).toBe(0);
      expect(updatedPassenger?.rank).toBe(2);
      expect(updatedPassenger?.hasMoved).toBe(true);
    });

    it('should rotate passenger pieces when rotate is true', () => {
      const passenger1: Piece = {
        id: 'passenger-1',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: '0',
        hasMoved: false,
      };

      const passenger2: Piece = {
        id: 'passenger-2',
        type: 'pawn',
        color: 'white',
        file: 1,
        rank: 1,
        level: '0',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: true,
        pieces: [passenger1, passenger2],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = executeBoardMove(context);
      const updated1 = result.updatedPieces.find(p => p.id === 'passenger-1');
      const updated2 = result.updatedPieces.find(p => p.id === 'passenger-2');
      
      expect(updated1?.file).toBe(1);
      expect(updated1?.rank).toBe(3);
      expect(updated2?.file).toBe(0);
      expect(updated2?.rank).toBe(2);
    });

    it('should not update non-passenger pieces', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: '0',
        hasMoved: false,
      };

      const nonPassenger: Piece = {
        id: 'non-passenger',
        type: 'rook',
        color: 'white',
        file: 4,
        rank: 4,
        level: '2',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: [passenger, nonPassenger],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = executeBoardMove(context);
      const updatedNonPassenger = result.updatedPieces.find(p => p.id === 'non-passenger');
      
      expect(updatedNonPassenger?.file).toBe(4);
      expect(updatedNonPassenger?.rank).toBe(4);
      expect(updatedNonPassenger?.level).toBe('2');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle cross-line movement with rotation', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'bishop',
        color: 'white',
        file: 0,
        rank: 1,
        level: '0',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'KL2',
        rotate: true,
        pieces: [passenger],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const validation = validateBoardMove(context);
      expect(validation.isValid).toBe(true);

      const result = executeBoardMove(context);
      expect(result.updatedPositions.WQL).toBe('KL2');
      
      const updatedPassenger = result.updatedPieces.find(p => p.id === 'passenger');
      expect(updatedPassenger).toBeDefined();
      expect(updatedPassenger?.hasMoved).toBe(true);
    });

    it('should validate multi-level jump with knight', () => {
      const knight: Piece = {
        id: 'knight',
        type: 'knight',
        color: 'white',
        file: 0,
        rank: 0,
        level: '0',
        hasMoved: false,
      };

      const blocker1: Piece = {
        id: 'blocker1',
        type: 'pawn',
        color: 'black',
        file: 0,
        rank: 0,
        level: '1',
        hasMoved: false,
      };

      const blocker2: Piece = {
        id: 'blocker2',
        type: 'pawn',
        color: 'black',
        file: 1,
        rank: 1,
        level: '2',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL4',
        rotate: false,
        pieces: [knight, blocker1, blocker2],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });
  });
});
