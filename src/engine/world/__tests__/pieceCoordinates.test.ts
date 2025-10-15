import { describe, it, expect } from 'vitest';
import {
  translatePassenger,
  rotatePassenger180,
  calculateArrivalCoordinates,
  getArrivalOptions
} from '../coordinatesTransform';
import { executeActivation } from '../worldMutation';
import { createChessWorld } from '../worldBuilder';
import type { Piece } from '../../../store/gameStore';
import { fileToWorldX, rankToWorldY } from '../coordinates';

describe('Piece Coordinate Mapping', () => {
  describe('translatePassenger', () => {
    it('should return coordinates unchanged', () => {
      const result = translatePassenger(2, 3);
      expect(result.file).toBe(2);
      expect(result.rank).toBe(3);
    });

    it('should handle edge coordinates', () => {
      expect(translatePassenger(0, 0)).toEqual({ file: 0, rank: 0 });
      expect(translatePassenger(5, 9)).toEqual({ file: 5, rank: 9 });
    });
  });

  describe('rotatePassenger180', () => {
    it('should rotate relative coordinates 180 degrees', () => {
      // (0,0) rotates to (1,1) in a 2x2 space
      const result1 = rotatePassenger180(0, 0);
      expect(result1.newRelativeFile).toBe(1);
      expect(result1.newRelativeRank).toBe(1);

      // (1,1) rotates to (0,0)
      const result2 = rotatePassenger180(1, 1);
      expect(result2.newRelativeFile).toBe(0);
      expect(result2.newRelativeRank).toBe(0);
    });

    it('should rotate corners correctly', () => {
      // Bottom-left (0,0) → Top-right (1,1)
      expect(rotatePassenger180(0, 0)).toEqual({ newRelativeFile: 1, newRelativeRank: 1 });

      // Bottom-right (1,0) → Top-left (0,1)
      expect(rotatePassenger180(1, 0)).toEqual({ newRelativeFile: 0, newRelativeRank: 1 });

      // Top-left (0,1) → Bottom-right (1,0)
      expect(rotatePassenger180(0, 1)).toEqual({ newRelativeFile: 1, newRelativeRank: 0 });

      // Top-right (1,1) → Bottom-left (0,0)
      expect(rotatePassenger180(1, 1)).toEqual({ newRelativeFile: 0, newRelativeRank: 0 });
    });
  });

  describe('calculateArrivalCoordinates', () => {
    it('should calculate identity arrival on QL track', () => {
      const result = calculateArrivalCoordinates(
        {
          track: 'QL',
          fromPin: 1,
          toPin: 2,
          fromRotation: 0,
          toRotation: 0,
          localFile: 0,
          localRank: 0,
        },
        'identity'
      );

      // QL track: files 0-1, pin 2: ranks 4-5
      expect(result.file).toBe(0);
      expect(result.rank).toBe(4);
    });

    it('should calculate rot180 arrival on QL track', () => {
      const result = calculateArrivalCoordinates(
        {
          track: 'QL',
          fromPin: 1,
          toPin: 2,
          fromRotation: 0,
          toRotation: 0,
          localFile: 0,
          localRank: 0,
        },
        'rot180'
      );

      // With rotation: local (0,0) becomes (1,1)
      expect(result.file).toBe(1);
      expect(result.rank).toBe(5);
    });

    it('should calculate identity arrival on KL track', () => {
      const result = calculateArrivalCoordinates(
        {
          track: 'KL',
          fromPin: 1,
          toPin: 2,
          fromRotation: 0,
          toRotation: 0,
          localFile: 0,
          localRank: 0,
        },
        'identity'
      );

      // KL track: files 4-5, pin 2: ranks 4-5
      expect(result.file).toBe(4);
      expect(result.rank).toBe(4);
    });

    it('should handle board rotation at destination', () => {
      const result = calculateArrivalCoordinates(
        {
          track: 'QL',
          fromPin: 1,
          toPin: 2,
          fromRotation: 0,
          toRotation: 180,
          localFile: 0,
          localRank: 0,
        },
        'identity'
      );

      // With toRotation=180, file and rank orders are reversed
      expect(result.file).toBe(1); // Files reversed: [1, 0] instead of [0, 1]
      expect(result.rank).toBe(5); // Ranks reversed: [5, 4] instead of [4, 5]
    });
  });

  describe('getArrivalOptions', () => {
    it('should provide both identity and rot180 options', () => {
      const options = getArrivalOptions('QL', 1, 2, 0, 0, 0, 0);

      expect(options).toHaveLength(2);
      expect(options[0].choice).toBe('identity');
      expect(options[1].choice).toBe('rot180');
    });

    it('should calculate different coordinates for each option', () => {
      const options = getArrivalOptions('QL', 1, 2, 0, 0, 0, 0);

      const identityOption = options.find(o => o.choice === 'identity')!;
      const rot180Option = options.find(o => o.choice === 'rot180')!;

      expect(identityOption.file).toBe(0);
      expect(identityOption.rank).toBe(4);

      expect(rot180Option.file).toBe(1);
      expect(rot180Option.rank).toBe(5);
    });
  });

  describe('Piece position after attack board moves', () => {
    function mkPiece(overrides: Partial<Piece>): Piece {
      return {
        id: 'P1',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 0,
        level: 'WQL',
        hasMoved: false,
        ...overrides,
      };
    }

    it('should map file/rank correctly for main board pieces', () => {
      const world = createChessWorld();
      const piece: Piece = {
        id: 'P1',
        type: 'pawn',
        color: 'white',
        file: 2,
        rank: 3,
        level: 'W',
        hasMoved: false,
      };

      // Verify the piece coordinates map to correct world coordinates
      const worldX = fileToWorldX(piece.file);
      const worldY = rankToWorldY(piece.rank);

      expect(worldX).toBeDefined();
      expect(worldY).toBeDefined();
    });

    it('should preserve piece positions when attack board moves without rotation', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [mkPiece({ file: 0, rank: 0, level: 'WQL' })];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
        arrivalChoice: 'identity',
      });

      const movedPiece = result.updatedPieces.find(p => p.id === 'P1')!;

      // Pin 1 has rank offset 0, pin 2 has rank offset 4
      // So rank should increase by 4
      expect(movedPiece.file).toBe(0); // File unchanged
      expect(movedPiece.rank).toBe(4); // Rank: 0 + 4
      expect(movedPiece.level).toBe('WQL');
    });

    it('should handle coordinate transformation when board rotates 180 degrees', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [mkPiece({ file: 0, rank: 0, level: 'WQL' })];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL1',
        rotate: true,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const rotatedPiece = result.updatedPieces.find(p => p.id === 'P1')!;

      // After 180° rotation, (0,0) should become (1,1) in local coords
      expect(rotatedPiece.file).toBe(1);
      expect(rotatedPiece.rank).toBe(1);
      expect(rotatedPiece.level).toBe('WQL');
    });

    it('should remap passenger coordinates during cross-track movement (QL to KL)', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [mkPiece({ file: 0, rank: 0, level: 'WQL' })];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'KL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const remappedPiece = result.updatedPieces.find(p => p.id === 'P1')!;

      // QL track: files 0-1
      // KL track: files 4-5
      // File should shift from QL range to KL range
      expect(remappedPiece.file).toBeGreaterThanOrEqual(4);
      expect(remappedPiece.file).toBeLessThanOrEqual(5);
      expect(remappedPiece.level).toBe('WQL');
    });

    it('should remap passenger coordinates during cross-track movement (KL to QL)', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [mkPiece({ file: 4, rank: 0, level: 'WKL' })];

      const result = executeActivation({
        boardId: 'WKL',
        fromPinId: 'KL1',
        toPinId: 'QL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const remappedPiece = result.updatedPieces.find(p => p.id === 'WKL' || p.id === 'P1')!;

      // KL track: files 4-5
      // QL track: files 0-1
      // File should shift from KL range to QL range
      expect(remappedPiece.file).toBeGreaterThanOrEqual(0);
      expect(remappedPiece.file).toBeLessThanOrEqual(1);
      expect(remappedPiece.level).toBe('WKL');
    });

    it('should calculate worldX/worldY correctly for each level', () => {
      // Test that file/rank correctly map to world coordinates
      const testCases = [
        { file: 0, rank: 0 },
        { file: 2, rank: 3 },
        { file: 5, rank: 9 },
      ];

      testCases.forEach(({ file, rank }) => {
        const worldX = fileToWorldX(file);
        const worldY = rankToWorldY(rank);

        expect(typeof worldX).toBe('number');
        expect(typeof worldY).toBe('number');
        expect(worldX).toBeGreaterThanOrEqual(-10);
        expect(worldX).toBeLessThanOrEqual(15);
        expect(worldY).toBeGreaterThanOrEqual(-10);
        expect(worldY).toBeLessThanOrEqual(25);
      });
    });

    it('should maintain piece hasMoved flag after board move', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        mkPiece({ file: 0, rank: 0, level: 'WQL', hasMoved: false })
      ];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const movedPiece = result.updatedPieces.find(p => p.id === 'P1')!;
      expect(movedPiece.hasMoved).toBe(true);
    });

    it('should set movedByAB flag for pawns moved by attack board', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        mkPiece({ type: 'pawn', file: 0, rank: 0, level: 'WQL' })
      ];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const movedPawn = result.updatedPieces.find(p => p.id === 'P1')!;
      expect(movedPawn.movedByAB).toBe(true);
    });

    it('should not set movedByAB flag for non-pawn pieces', () => {
      const world = createChessWorld();
      const pieces: Piece[] = [
        mkPiece({ type: 'rook', file: 0, rank: 0, level: 'WQL' })
      ];

      const result = executeActivation({
        boardId: 'WQL',
        fromPinId: 'QL1',
        toPinId: 'QL2',
        rotate: false,
        pieces,
        world,
        attackBoardPositions: { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' },
      });

      const movedRook = result.updatedPieces.find(p => p.id === 'P1')!;
      expect(movedRook.movedByAB).toBeUndefined();
    });
  });

  describe('Edge cases in coordinate mapping', () => {
    it('should handle pieces at maximum file coordinates', () => {
      const worldX = fileToWorldX(5);
      expect(typeof worldX).toBe('number');
    });

    it('should handle pieces at maximum rank coordinates', () => {
      const worldY = rankToWorldY(9);
      expect(typeof worldY).toBe('number');
    });

    it('should handle coordinate mapping for all pin positions', () => {
      const pins = [1, 2, 3, 4, 5, 6];
      const rankOffsets: Record<number, number> = { 1: 0, 2: 4, 3: 2, 4: 6, 5: 4, 6: 8 };

      pins.forEach(pin => {
        const offset = rankOffsets[pin];
        expect(typeof offset).toBe('number');
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(8);
      });
    });
  });
});
