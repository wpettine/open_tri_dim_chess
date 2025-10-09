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
        attackBoardPositions: {
          ...basePositions,
          WKL: 'KL3',
        },
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

  describe('Direction & Occupancy Constraints', () => {
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
        attackBoardPositions: {
          ...basePositions,
          WQL: 'QL2',
          WKL: 'KL3',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject backward movement when board is occupied', () => {
      const passenger: Piece = {
        id: 'passenger-pawn',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 4,
        level: 'WQL',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL2',
        toPinId: 'QL1',
        rotate: false,
        pieces: [passenger],
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WQL: 'QL2',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should allow backward movement when board is empty', () => {
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

    it('should reject backward+side movement when occupied', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'bishop',
        color: 'white',
        file: 0,
        rank: 4,
        level: 'WQL',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL2',
        toPinId: 'KL1',
        rotate: false,
        pieces: [passenger],
        world: mockWorld,
        attackBoardPositions: {
          ...basePositions,
          WQL: 'QL2',
          WKL: 'KL3',
        },
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Vertical Shadow Validation', () => {
    it('should allow movement when no blocking pieces exist at destination', () => {
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

    it('should reject movement when non-knight piece occupies destination square', () => {
      const blockingPiece: Piece = {
        id: 'blocking-rook',
        type: 'rook',
        color: 'white',
        file: 0,
        rank: 4,
        level: 'N',
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
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('shadow');
    });

    it('should allow movement when knight is at destination square', () => {
      const knight: Piece = {
        id: 'knight',
        type: 'knight',
        color: 'white',
        file: 0,
        rank: 4,
        level: 'B',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces: [knight],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should check all four destination squares for shadows', () => {
      const blockingPiece: Piece = {
        id: 'blocking-bishop',
        type: 'bishop',
        color: 'black',
        file: 1,
        rank: 5,
        level: 'W',
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
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('shadow');
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
        level: 'WQL',
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
      expect(updatedPassenger?.rank).toBe(4);
      expect(updatedPassenger?.hasMoved).toBe(true);
    });

    it('should rotate passenger pieces when rotate is true', () => {
      const passenger1: Piece = {
        id: 'passenger-1',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: 'WQL',
        hasMoved: false,
      };

      const passenger2: Piece = {
        id: 'passenger-2',
        type: 'pawn',
        color: 'white',
        file: 1,
        rank: 1,
        level: 'WQL',
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
      
      expect(updated1?.file).toBe(0);
      expect(updated1?.rank).toBe(5);
      expect(updated2?.file).toBe(1);
      expect(updated2?.rank).toBe(4);
    });

    it('should not update non-passenger pieces', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: 'WQL',
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

  describe('Rotation Validation', () => {
    it('should allow rotation with 0 pieces on board', () => {
      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL1',
        rotate: true,
        pieces: basePieces,
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should allow rotation with 1 piece on board', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: 'WQL',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL1',
        rotate: true,
        pieces: [passenger],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(true);
    });

    it('should reject rotation with 2 pieces on board', () => {
      const passenger1: Piece = {
        id: 'passenger-1',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: 'WQL',
        hasMoved: false,
      };

      const passenger2: Piece = {
        id: 'passenger-2',
        type: 'rook',
        color: 'white',
        file: 1,
        rank: 1,
        level: 'WQL',
        hasMoved: false,
      };

      const context: BoardMoveContext = {
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL1',
        rotate: true,
        pieces: [passenger1, passenger2],
        world: mockWorld,
        attackBoardPositions: basePositions,
      };

      const result = validateBoardMove(context);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Cannot rotate with more than 1 piece');
    });

    it('should allow movement with rotation when only 1 piece', () => {
      const passenger: Piece = {
        id: 'passenger',
        type: 'bishop',
        color: 'white',
        file: 0,
        rank: 1,
        level: 'WQL',
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
  });

  describe('Adjacency Tests - QL1 Specific', () => {
    it('QL1 should allow only QL2, KL1, KL2', () => {
      const validDestinations = ['QL2', 'KL1', 'KL2'];
      const allPins = ['QL1', 'QL2', 'QL3', 'QL4', 'QL5', 'QL6', 'KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'];

      allPins.forEach(pin => {
        if (pin === 'QL1') return;

        const context: BoardMoveContext = {
          boardId: 'WQL',
          fromPinId: 'QL1',
          toPinId: pin,
          rotate: false,
          pieces: basePieces,
          world: mockWorld,
          attackBoardPositions: {
            ...basePositions,
            WKL: 'KL3',
          },
        };

        const result = validateBoardMove(context);
        
        if (validDestinations.includes(pin)) {
          expect(result.isValid).toBe(true);
        } else {
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('not adjacent');
        }
      });
    });

    it('QL1 should reject QL4, QL5, KL3, KL4 (the ones incorrectly shown before)', () => {
      const invalidDestinations = ['QL4', 'QL5', 'KL3', 'KL4'];

      invalidDestinations.forEach(pin => {
        const context: BoardMoveContext = {
          boardId: 'WQL',
          fromPinId: 'QL1',
          toPinId: pin,
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
  });
});
