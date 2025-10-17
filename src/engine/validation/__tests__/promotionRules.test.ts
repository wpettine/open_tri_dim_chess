/**
 * Unit tests for pawn promotion rules
 *
 * Tests cover:
 * - Furthest rank calculation for all file types
 * - Corner overhang detection
 * - Promotion square existence
 * - Full promotion checks (immediate, deferred, forced)
 * - Missing promotion plane detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFurthestRank,
  promotionSquareExists,
  checkCornerOverhang,
  checkPromotion,
  detectForcedPromotions,
  isOnMissingPromotionPlane,
  type TrackStates,
  type PromotionCheck,
} from '../promotionRules';
import { createChessWorld } from '../../world/worldBuilder';
import type { ChessWorld } from '../../world/types';
import type { Piece } from '../../../store/gameStore';

describe('Promotion Rules', () => {
  let world: ChessWorld;
  let standardTrackStates: TrackStates;
  let standardAttackBoardStates: Record<string, { activeInstanceId: string }>;

  beforeEach(() => {
    world = createChessWorld();
    standardTrackStates = {
      QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
      KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
    };
    standardAttackBoardStates = {
      WQL: { activeInstanceId: 'QL1:0' },
      WKL: { activeInstanceId: 'KL1:0' },
      BQL: { activeInstanceId: 'QL6:0' },
      BKL: { activeInstanceId: 'KL6:0' },
    };
  });

  describe('getFurthestRank', () => {
    describe('Files b, c (middle files) - Fixed ranks', () => {
      it('should return rank 8 for White on file b', () => {
        const rank = getFurthestRank(2, 'white', standardTrackStates, world, standardAttackBoardStates); // file 2 = 'b'
        expect(rank).toBe(8);
      });

      it('should return rank 8 for White on file c', () => {
        const rank = getFurthestRank(3, 'white', standardTrackStates, world, standardAttackBoardStates); // file 3 = 'c'
        expect(rank).toBe(8);
      });

      it('should return rank 1 for Black on file b', () => {
        const rank = getFurthestRank(2, 'black', standardTrackStates, world, standardAttackBoardStates); // file 2 = 'b'
        expect(rank).toBe(1);
      });

      it('should return rank 1 for Black on file c', () => {
        const rank = getFurthestRank(3, 'black', standardTrackStates, world, standardAttackBoardStates); // file 3 = 'c'
        expect(rank).toBe(1);
      });
    });

    describe('Files z, e (outer files) - Rank 0/9 when board present', () => {
      it('should return rank 9 for White on file z when BLACK QL board at pin 6', () => {
        const rank = getFurthestRank(0, 'white', standardTrackStates, world, standardAttackBoardStates);
        expect(rank).toBe(9);
      });

      it('should return rank 9 for White on file e when BLACK KL board at pin 6', () => {
        const rank = getFurthestRank(5, 'white', standardTrackStates, world, standardAttackBoardStates);
        expect(rank).toBe(9);
      });

      it('should return rank 0 for Black on file z when WHITE QL board at pin 1', () => {
        const rank = getFurthestRank(0, 'black', standardTrackStates, world, standardAttackBoardStates);
        expect(rank).toBe(0);
      });

      it('should return rank 0 for Black on file e when WHITE KL board at pin 1', () => {
        const rank = getFurthestRank(5, 'black', standardTrackStates, world, standardAttackBoardStates);
        expect(rank).toBe(0);
      });

      it('should return null for White on file z when BLACK QL board NOT at pin 6', () => {
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          QL: { ...standardTrackStates.QL, blackBoardPin: 3 },
        };
        const modifiedAttackBoardStates = {
          ...standardAttackBoardStates,
          BQL: { activeInstanceId: 'QL3:0' },
        };
        const rank = getFurthestRank(0, 'white', modifiedTrackStates, world, modifiedAttackBoardStates);
        expect(rank).toBeNull();
      });

      it('should return null for Black on file e when WHITE KL board NOT at pin 1', () => {
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          KL: { ...standardTrackStates.KL, whiteBoardPin: 4 },
        };
        const modifiedAttackBoardStates = {
          ...standardAttackBoardStates,
          WKL: { activeInstanceId: 'KL4:0' },
        };
        const rank = getFurthestRank(5, 'black', modifiedTrackStates, world, modifiedAttackBoardStates);
        expect(rank).toBeNull();
      });
    });

    describe('Files a, d (corner files) - Dynamic based on overhang', () => {
      it('should return rank 9 for White on file a WITH overhang (Black at QL6)', () => {
        const rank = getFurthestRank(1, 'white', standardTrackStates, world, standardAttackBoardStates);
        // Black QL is at pin 6, so there IS overhang
        expect(rank).toBe(9);
      });

      it('should return rank 8 for White on file a WITHOUT overhang (Black NOT at QL6)', () => {
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          QL: { ...standardTrackStates.QL, blackBoardPin: 4 },
        };
        const rank = getFurthestRank(1, 'white', modifiedTrackStates, world, standardAttackBoardStates);
        // Black QL is at pin 4, so NO overhang
        expect(rank).toBe(8);
      });

      it('should return rank 9 for White on file d WITH overhang (Black at KL6)', () => {
        const rank = getFurthestRank(4, 'white', standardTrackStates, world, standardAttackBoardStates);
        // Black KL is at pin 6, so there IS overhang
        expect(rank).toBe(9);
      });

      it('should return rank 8 for White on file d WITHOUT overhang (Black NOT at KL6)', () => {
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          KL: { ...standardTrackStates.KL, blackBoardPin: 4 },
        };
        const rank = getFurthestRank(4, 'white', modifiedTrackStates, world, standardAttackBoardStates);
        // Black KL is at pin 4, so NO overhang
        expect(rank).toBe(8);
      });

      it('should return rank 0 for Black on file a WITH overhang (White at QL1)', () => {
        const rank = getFurthestRank(1, 'black', standardTrackStates, world, standardAttackBoardStates);
        // White QL is at pin 1, so there IS overhang
        expect(rank).toBe(0);
      });

      it('should return rank 1 for Black on file a WITHOUT overhang (White NOT at QL1)', () => {
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          QL: { ...standardTrackStates.QL, whiteBoardPin: 3 },
        };
        const rank = getFurthestRank(1, 'black', modifiedTrackStates, world, standardAttackBoardStates);
        // White QL is at pin 3, so NO overhang
        expect(rank).toBe(1);
      });
    });
  });

  describe('checkCornerOverhang', () => {
    it('should detect White corner overhang on file a (Black QL at pin 6)', () => {
      const hasOverhang = checkCornerOverhang(1, 'white', standardTrackStates);
      expect(hasOverhang).toBe(true);
    });

    it('should detect White corner overhang on file d (Black KL at pin 6)', () => {
      const hasOverhang = checkCornerOverhang(4, 'white', standardTrackStates);
      expect(hasOverhang).toBe(true);
    });

    it('should NOT detect overhang when Black QL NOT at pin 6', () => {
      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        QL: { ...standardTrackStates.QL, blackBoardPin: 4 },
      };
      const hasOverhang = checkCornerOverhang(1, 'white', modifiedTrackStates);
      expect(hasOverhang).toBe(false);
    });

    it('should detect Black corner overhang on file a (White QL at pin 1)', () => {
      const hasOverhang = checkCornerOverhang(1, 'black', standardTrackStates);
      expect(hasOverhang).toBe(true);
    });

    it('should detect Black corner overhang on file d (White KL at pin 1)', () => {
      const hasOverhang = checkCornerOverhang(4, 'black', standardTrackStates);
      expect(hasOverhang).toBe(true);
    });

    it('should NOT detect overhang when White KL NOT at pin 1', () => {
      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        KL: { ...standardTrackStates.KL, whiteBoardPin: 3 },
      };
      const hasOverhang = checkCornerOverhang(4, 'black', modifiedTrackStates);
      expect(hasOverhang).toBe(false);
    });

    it('should return false for non-corner files (b, c)', () => {
      expect(checkCornerOverhang(1, 'white', standardTrackStates)).toBe(true); // file 1 = 'a' is corner
      expect(checkCornerOverhang(2, 'white', standardTrackStates)).toBe(false); // file 2 = 'b' is NOT corner
      expect(checkCornerOverhang(3, 'white', standardTrackStates)).toBe(false); // file 3 = 'c' is NOT corner
    });
  });

  describe('promotionSquareExists', () => {
    it('should return true for file b rank 8 (always exists)', () => {
      const exists = promotionSquareExists(2, 8, 'white', standardTrackStates, world, standardAttackBoardStates); // file 2 = 'b'
      expect(exists).toBe(true);
    });

    it('should return true for file z rank 9 when BLACK QL board at pin 6', () => {
      const exists = promotionSquareExists(0, 9, 'white', standardTrackStates, world, standardAttackBoardStates);
      expect(exists).toBe(true);
    });

    it('should return false for file z rank 9 when BLACK QL board NOT at pin 6', () => {
      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        QL: { ...standardTrackStates.QL, blackBoardPin: 3 },
      };
      const modifiedAttackBoardStates = {
        ...standardAttackBoardStates,
        BQL: { activeInstanceId: 'QL3:0' },
      };
      const exists = promotionSquareExists(0, 9, 'white', modifiedTrackStates, world, modifiedAttackBoardStates);
      expect(exists).toBe(false);
    });

    it('should return true for file e rank 0 when WHITE KL board at pin 1', () => {
      const exists = promotionSquareExists(5, 0, 'black', standardTrackStates, world, standardAttackBoardStates);
      expect(exists).toBe(true);
    });

    it('should return false for file e rank 0 when WHITE KL board NOT at pin 1', () => {
      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        KL: { ...standardTrackStates.KL, whiteBoardPin: 4 },
      };
      const modifiedAttackBoardStates = {
        ...standardAttackBoardStates,
        WKL: { activeInstanceId: 'KL4:0' },
      };
      const exists = promotionSquareExists(5, 0, 'black', modifiedTrackStates, world, modifiedAttackBoardStates);
      expect(exists).toBe(false);
    });
  });

  describe('checkPromotion', () => {
    describe('Normal promotion (immediate)', () => {
      it('should trigger promotion for White pawn on b8B', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 2, // file 2 = 'b'
          rank: 8,
          level: 'B',
          hasMoved: true,
        };
        const square = world.squares.get('b8B')!;
        const result = checkPromotion(pawn, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(true);
        expect(result.canPromote).toBe(true);
        expect(result.isDeferred).toBe(false);
      });

      it('should trigger promotion for Black pawn on c1W', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'black',
          file: 2,
          rank: 1,
          level: 'W',
          hasMoved: true,
        };
        const square = world.squares.get('c1W')!;
        const result = checkPromotion(pawn, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(true);
        expect(result.canPromote).toBe(true);
        expect(result.isDeferred).toBe(false);
      });

      it('should NOT trigger promotion for pawn not at furthest rank', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 2, // file 2 = 'b'
          rank: 2,
          level: 'W',
          hasMoved: false,
        };
        const square = world.squares.get('b2W')!;
        const result = checkPromotion(pawn, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(false);
        expect(result.canPromote).toBe(false);
        expect(result.isDeferred).toBe(false);
      });
    });

    describe('Deferred promotion (corner overhang)', () => {
      it('should defer promotion for White pawn on a8B with Black QL overhang', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 8,
          level: 'B',
          hasMoved: true,
        };
        const square = world.squares.get('a8B')!;

        // Black QL at pin 6 creates overhang
        const result = checkPromotion(pawn, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(true);
        expect(result.canPromote).toBe(false);
        expect(result.isDeferred).toBe(true);
        expect(result.overhangBoardId).toBe('BQL');
      });

      it('should defer promotion for White pawn on d8B with Black KL overhang', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 4,
          rank: 8,
          level: 'B',
          hasMoved: true,
        };
        const square = world.squares.get('d8B')!;

        // Black KL at pin 6 creates overhang
        const result = checkPromotion(pawn, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(true);
        expect(result.canPromote).toBe(false);
        expect(result.isDeferred).toBe(true);
        expect(result.overhangBoardId).toBe('BKL');
      });

      it('should promote immediately if overhang removed', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 8,
          level: 'B',
          hasMoved: true,
        };
        const square = world.squares.get('a8B')!;

        // Black QL at pin 4 (NOT at pin 6) - no overhang
        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          QL: { ...standardTrackStates.QL, blackBoardPin: 4 },
        };

        const result = checkPromotion(pawn, square, modifiedTrackStates, world, standardAttackBoardStates);

        // With overhang removed, furthest rank is 8, so pawn at rank 8 promotes immediately
        expect(result.shouldPromote).toBe(true);
        expect(result.canPromote).toBe(true);
        expect(result.isDeferred).toBe(false);
      });
    });

    describe('Missing promotion plane (z/e files)', () => {
      it('should return error for z file when BLACK QL board not at pin 6', () => {
        const pawn: Piece = {
          id: 'test-pawn',
          type: 'pawn',
          color: 'white',
          file: 0,
          rank: 8,
          level: 'QL3',
          hasMoved: true,
        };

        // Mock a square (won't exist in real world at this position)
        const mockSquare = {
          id: 'z8QL3:0',
          boardId: 'QL3:0',
          file: 0,
          rank: 8,
          worldX: 0,
          worldY: 2.1,
          worldZ: 5,
          color: 'light' as const,
        };

        const modifiedTrackStates: TrackStates = {
          ...standardTrackStates,
          QL: { ...standardTrackStates.QL, blackBoardPin: 3 },
        };
        const modifiedAttackBoardStates = {
          ...standardAttackBoardStates,
          BQL: { activeInstanceId: 'QL3:0' },
        };

        const result = checkPromotion(pawn, mockSquare, modifiedTrackStates, world, modifiedAttackBoardStates);

        expect(result.shouldPromote).toBe(false);
        expect(result.reason).toBe('E_NONEXISTENT_TARGET');
      });
    });

    describe('Non-pawn pieces', () => {
      it('should not trigger promotion for non-pawn pieces', () => {
        const rook: Piece = {
          id: 'test-rook',
          type: 'rook',
          color: 'white',
          file: 2, // file 2 = 'b'
          rank: 1,
          level: 'W',
          hasMoved: true,
        };
        const square = world.squares.get('b1W')!;
        const result = checkPromotion(rook, square, standardTrackStates, world, standardAttackBoardStates);

        expect(result.shouldPromote).toBe(false);
        expect(result.canPromote).toBe(false);
        expect(result.isDeferred).toBe(false);
      });
    });
  });

  describe('detectForcedPromotions', () => {
    it('should detect forced promotion when overhang removed', () => {
      const pieces: Piece[] = [
        {
          id: 'pawn1',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 8,
          level: 'B',
          hasMoved: true,
          promotionState: {
            isDeferred: true,
            overhangBoardId: 'BQL',
            canPromote: false,
          },
        },
      ];

      // Black QL board moved away from pin 6 (now at pin 4)
      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        QL: { ...standardTrackStates.QL, blackBoardPin: 4 },
      };

      const forced = detectForcedPromotions(pieces, modifiedTrackStates, world, standardAttackBoardStates);

      expect(forced).toHaveLength(1);
      expect(forced[0].pieceId).toBe('pawn1');
    });

    it('should NOT detect forced promotion if overhang still present', () => {
      const pieces: Piece[] = [
        {
          id: 'pawn1',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 8,
          level: 'B',
          hasMoved: true,
          promotionState: {
            isDeferred: true,
            overhangBoardId: 'BQL',
            canPromote: false,
          },
        },
      ];

      // Black QL still at pin 6 (overhang still present)
      const forced = detectForcedPromotions(pieces, standardTrackStates, world, standardAttackBoardStates);

      expect(forced).toHaveLength(0);
    });

    it('should handle multiple deferred promotions', () => {
      const pieces: Piece[] = [
        {
          id: 'pawn1',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 8,
          level: 'B',
          hasMoved: true,
          promotionState: {
            isDeferred: true,
            overhangBoardId: 'BQL',
            canPromote: false,
          },
        },
        {
          id: 'pawn2',
          type: 'pawn',
          color: 'white',
          file: 4,
          rank: 8,
          level: 'B',
          hasMoved: true,
          promotionState: {
            isDeferred: true,
            overhangBoardId: 'BKL',
            canPromote: false,
          },
        },
      ];

      // Both Black boards moved away
      const modifiedTrackStates: TrackStates = {
        QL: { whiteBoardPin: 1, blackBoardPin: 4, whiteRotation: 0, blackRotation: 0 },
        KL: { whiteBoardPin: 1, blackBoardPin: 4, whiteRotation: 0, blackRotation: 0 },
      };

      const forced = detectForcedPromotions(pieces, modifiedTrackStates, world, standardAttackBoardStates);

      expect(forced).toHaveLength(2);
    });

    it('should ignore pawns without deferred promotion', () => {
      const pieces: Piece[] = [
        {
          id: 'pawn1',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
      ];

      const forced = detectForcedPromotions(pieces, standardTrackStates, world, standardAttackBoardStates);

      expect(forced).toHaveLength(0);
    });
  });

  describe('isOnMissingPromotionPlane', () => {
    it('should return true for z file pawn when BLACK QL board not at pin 6', () => {
      const pawn: Piece = {
        id: 'test-pawn',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 1,
        level: 'QL3',
        hasMoved: true,
      };

      const modifiedTrackStates: TrackStates = {
        ...standardTrackStates,
        QL: { ...standardTrackStates.QL, blackBoardPin: 3 },
      };
      const modifiedAttackBoardStates = {
        ...standardAttackBoardStates,
        BQL: { activeInstanceId: 'QL3:0' },
      };

      const result = isOnMissingPromotionPlane(pawn, modifiedTrackStates, world, modifiedAttackBoardStates);
      expect(result).toBe(true);
    });

    it('should return false for z file pawn when BLACK QL board at pin 6', () => {
      const pawn: Piece = {
        id: 'test-pawn',
        type: 'pawn',
        color: 'white',
        file: 0,
        rank: 1,
        level: 'QL1',
        hasMoved: true,
      };

      const result = isOnMissingPromotionPlane(pawn, standardTrackStates, world, standardAttackBoardStates);
      expect(result).toBe(false);
    });

    it('should return false for non-z/e files', () => {
      const pawn: Piece = {
        id: 'test-pawn',
        type: 'pawn',
        color: 'white',
        file: 2, // file 2 = 'b', not z or e
        rank: 2,
        level: 'W',
        hasMoved: false,
      };

      const result = isOnMissingPromotionPlane(pawn, standardTrackStates, world, standardAttackBoardStates);
      expect(result).toBe(false);
    });
  });
});
