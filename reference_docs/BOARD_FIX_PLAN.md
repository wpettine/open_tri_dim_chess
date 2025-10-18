# Board Square Color Fix Plan

**Version:** 1.0
**Date:** 2025-10-18
**Author:** Claude Code
**Status:** Planning Phase

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Solution Approach](#solution-approach)
4. [Implementation Plan](#implementation-plan)
5. [Testing Strategy](#testing-strategy)
6. [Validation Checklist](#validation-checklist)
7. [Rollback Plan](#rollback-plan)

---

## Problem Statement

### Current Issue

Bishops are able to move to squares of the opposite color, violating the fundamental chess rule that bishops must remain on their starting square color throughout the game.

**Example Bug:**
- Light-square bishop at `a2W` (light) can move to `a3N` (should be dark, but incorrectly shown as light)
- Dark squares like `b3N`, `c4N`, `d5N` are being blocked when they should be legal moves

### Impact

- **Gameplay:** Breaks fundamental chess rules, making the game unplayable for serious players
- **Bishop Strategy:** Eliminates the light-square/dark-square bishop distinction
- **User Trust:** Undermines confidence in the engine's correctness

---

## Root Cause Analysis

### The Raumschach Color Rule

In **Raumschach (3D chess)**, square colors follow a **vertical alignment principle**:

> **Rule:** A square at position `(file, rank)` has the **same color** on every level.

**Formula:**
```
color = (file + rank) % 2
  where 0 = dark, 1 = light
```

**Key Insight:** The level/board does NOT affect color. A dark square on W is also dark on N and B.

### File Number Mapping

The coordinate system uses this file mapping:
```
'z' → 0
'a' → 1
'b' → 2
'c' → 3
'd' → 4
'e' → 5
```

### Authoritative Color Specification

The JSON specification in `REVISED_MEDER_COORDINATE_SYSTEM.md` Appendix 3 provides the ground truth for all square colors across:
- 3 main boards (W, N, B) - 48 squares total
- 12 attack board positions (QL1-6, KL1-6) - 48 squares total (4 squares × 12 boards)

**Verification Examples from Spec:**
- `a1W = dark` → file=1, rank=1 → (1+1)%2 = 0 ✓
- `b1W = light` → file=2, rank=1 → (2+1)%2 = 1 ✓
- `a2W = light` → file=1, rank=2 → (1+2)%2 = 1 ✓
- `a3N = dark` → file=1, rank=3 → (1+3)%2 = 0 ✓ (same file/rank as a1W!)
- `z0QL1 = dark` → file=0, rank=0 → (0+0)%2 = 0 ✓
- `a0QL1 = light` → file=1, rank=0 → (1+0)%2 = 1 ✓

---

## Solution Approach

### Phase 1: World Builder Verification

**File:** `src/engine/world/worldBuilder.ts`

**Current State:**
```typescript
const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
```

**Required State:** The formula is already correct!

**Actions:**
1. Verify the formula is applied in both:
   - `createMainBoard()` function (line ~78)
   - `createAttackBoardInstance()` function (line ~156)
2. Ensure NO level/pin-based adjustments are made to color calculation
3. Verify that file numbers are correctly mapped from file letters

### Phase 2: File Mapping Verification

**File:** `src/engine/world/coordinates.ts`

**Required Verification:**
```typescript
export function stringToFile(fileStr: string): number {
  const fileMap: Record<string, number> = {
    'z': 0,
    'a': 1,
    'b': 2,
    'c': 3,
    'd': 4,
    'e': 5,
  };
  return fileMap[fileStr] ?? -1;
}
```

**Actions:**
1. Confirm the mapping is exactly as shown above
2. Add defensive error handling for invalid file strings
3. Add JSDoc comments clarifying the mapping

### Phase 3: Bishop Move Validation

**File:** `src/engine/validation/pieceMovement.ts`

**Current Implementation:**
```typescript
function getSquareColor(file: number, rank: number): number {
  return (file + rank) % 2;
}

// In validateBishopMove():
const fromColor = getSquareColor(fromSquare.file, fromSquare.rank);
const toColor = getSquareColor(toSquare.file, toSquare.rank);

if (fromColor !== toColor) {
  return { valid: false, reason: 'bishop must stay on same color squares' };
}
```

**Required State:** The implementation is already correct!

**Actions:**
1. Verify `getSquareColor()` uses ONLY file and rank (NO level)
2. Ensure the function is pure (no side effects)
3. Add comprehensive JSDoc explaining the Raumschach color rule
4. Verify this check occurs AFTER diagonal validation but BEFORE path checking

### Phase 4: Queen Move Validation

**File:** `src/engine/validation/pieceMovement.ts`

**Current Implementation:**
```typescript
export function validateQueenMove(context: MoveValidationContext): MoveResult {
  const rookResult = validateRookMove(context);
  if (rookResult.valid) return rookResult;

  const bishopResult = validateBishopMove(context);
  if (bishopResult.valid) return bishopResult;

  return { valid: false, reason: 'invalid queen move' };
}
```

**Issue:** Queens moving as bishops will be subject to the same color restriction.

**Actions:**
1. Verify that when a queen moves diagonally, the bishop validation (including color check) applies
2. Verify that when a queen moves orthogonally, NO color check applies
3. Add test cases for both movement types

---

## Implementation Plan

### Step 1: Create Color Specification Test Suite

**New File:** `src/engine/world/__tests__/squareColors.test.ts`

**Purpose:** Comprehensive test coverage against the authoritative JSON spec

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';

// Import or embed the authoritative color spec
const AUTHORITATIVE_COLORS = {
  mainBoards: { /* ... from JSON ... */ },
  attackBoards: { /* ... from JSON ... */ }
};

describe('Square Color Validation', () => {
  const world = createChessWorld();

  describe('Main Boards', () => {
    it('should match authoritative colors for W board', () => {
      // Test all 16 squares of W board
    });

    it('should match authoritative colors for N board', () => {
      // Test all 16 squares of N board
    });

    it('should match authoritative colors for B board', () => {
      // Test all 16 squares of B board
    });
  });

  describe('Attack Boards', () => {
    it('should match authoritative colors for QL1-QL6', () => {
      // Test all 6 QL boards × 4 squares each = 24 squares
    });

    it('should match authoritative colors for KL1-KL6', () => {
      // Test all 6 KL boards × 4 squares each = 24 squares
    });
  });

  describe('Vertical Color Alignment', () => {
    it('should have same color for a1W and a3N (same file/rank)', () => {
      // a1W is not on N board, but a3N exists
      // Verify (1+1)%2 === (1+3)%2 is FALSE - they're different!
    });

    it('should have same color for a3W and a3N (same file/rank)', () => {
      const a3W = world.squares.get('a3W');
      const a3N = world.squares.get('a3N');
      expect(a3W?.color).toBe(a3N?.color);
    });

    it('should have same color for a5N and a5B (same file/rank)', () => {
      const a5N = world.squares.get('a5N');
      const a5B = world.squares.get('a5B');
      expect(a5N?.color).toBe(a5B?.color);
    });
  });

  describe('Diagonal Pattern', () => {
    it('should alternate colors along diagonal', () => {
      // a1W → b2W → c3W → d4W should alternate dark/light/dark/light
    });
  });

  describe('File Pattern', () => {
    it('should alternate colors along each file', () => {
      // a1W → a2W → a3W → a4W should alternate
    });
  });
});
```

**Expected Outcome:**
- 96 individual square color assertions (48 main + 48 attack)
- Tests pass 100% against authoritative spec
- Any deviation fails loudly with clear error message

### Step 2: Create Bishop Validation Test Suite

**New File:** `src/engine/validation/__tests__/bishopColorRules.test.ts`

**Purpose:** Verify bishops cannot violate color rules

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { validateBishopMove } from '../pieceMovement';
import { createChessWorld } from '../../world/worldBuilder';

describe('Bishop Color Rule Enforcement', () => {
  const world = createChessWorld();

  describe('Light-square bishop', () => {
    it('should allow move from a2W (light) to b3N (light)', () => {
      // Setup piece at a2W
      // Validate move to b3N
      // Expect valid: true
    });

    it('should block move from a2W (light) to a3N (dark)', () => {
      // Setup piece at a2W
      // Validate move to a3N
      // Expect valid: false, reason: 'bishop must stay on same color squares'
    });

    it('should allow move from b1W (light) to c2W (light)', () => {
      // Diagonal within same level
    });

    it('should allow move from b1W (light) to a2W (light)', () => {
      // Diagonal within same level
    });
  });

  describe('Dark-square bishop', () => {
    it('should allow move from c1W (dark) to d2W (dark)', () => {
      // Setup piece at c1W
      // Validate move to d2W
      // Expect valid: true
    });

    it('should block move from c1W (dark) to b2W (light)', () => {
      // Setup piece at c1W
      // Validate move to b2W
      // Expect valid: false
    });
  });

  describe('Cross-level moves', () => {
    it('should allow light bishop from b3W to c4N (both light)', () => {
      // File=2,rank=3: (2+3)%2=1 (light)
      // File=3,rank=4: (3+4)%2=1 (light)
    });

    it('should block light bishop from b3W to d5N (dark)', () => {
      // File=2,rank=3: (2+3)%2=1 (light)
      // File=4,rank=5: (4+5)%2=1 (light) -- WAIT this is light too!
    });
  });

  describe('Attack board moves', () => {
    it('should enforce colors on attack boards', () => {
      // Test bishop moving from main board to attack board
      // Test bishop moving within attack board
      // Test bishop moving between attack boards (if allowed by path rules)
    });
  });
});
```

**Expected Outcome:**
- Comprehensive coverage of legal and illegal bishop moves
- Clear error messages for color violations
- All tests pass

### Step 3: File Mapping Verification Tests

**Add to:** `src/engine/world/__tests__/coordinates.test.ts`

**Purpose:** Ensure file letters map to correct numbers

**Test Structure:**
```typescript
describe('File Letter to Number Mapping', () => {
  it('should map z to 0', () => {
    expect(stringToFile('z')).toBe(0);
  });

  it('should map a to 1', () => {
    expect(stringToFile('a')).toBe(1);
  });

  it('should map b to 2', () => {
    expect(stringToFile('b')).toBe(2);
  });

  it('should map c to 3', () => {
    expect(stringToFile('c')).toBe(3);
  });

  it('should map d to 4', () => {
    expect(stringToFile('d')).toBe(4);
  });

  it('should map e to 5', () => {
    expect(stringToFile('e')).toBe(5);
  });

  it('should verify color formula for known squares', () => {
    // a1: (1+1)%2 = 0 = dark
    expect((stringToFile('a') + 1) % 2).toBe(0);

    // b1: (2+1)%2 = 1 = light
    expect((stringToFile('b') + 1) % 2).toBe(1);

    // a2: (1+2)%2 = 1 = light
    expect((stringToFile('a') + 2) % 2).toBe(1);
  });
});
```

### Step 4: Integration Testing

**New File:** `src/engine/__tests__/bishopIntegration.test.ts`

**Purpose:** End-to-end testing of bishop moves in real game scenarios

**Test Structure:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';

describe('Bishop Movement Integration Tests', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('should allow light-square bishop to move within its color', () => {
    // Start game
    // Move b1W bishop to a2W (light to light)
    // Verify move succeeds
  });

  it('should prevent light-square bishop from moving to dark square', () => {
    // Setup scenario where bishop tries to move to dark square
    // Verify move is blocked
    // Verify error message is clear
  });

  it('should correctly identify bishop color at start', () => {
    const pieces = useGameStore.getState().pieces;
    const whiteBishops = pieces.filter(p => p.type === 'bishop' && p.color === 'white');

    // b1W is light-square bishop: (2+1)%2 = 1
    // c1W is dark-square bishop: (3+1)%2 = 0

    const b1Bishop = whiteBishops.find(b => b.file === 2 && b.rank === 1);
    const c1Bishop = whiteBishops.find(b => b.file === 3 && b.rank === 1);

    // Calculate expected colors
    expect((b1Bishop!.file + b1Bishop!.rank) % 2).toBe(1); // light
    expect((c1Bishop!.file + c1Bishop!.rank) % 2).toBe(0); // dark
  });
});
```

---

## Testing Strategy

### Test Pyramid

```
                /\
               /  \
              / E2E \          ← Integration tests (10)
             /------\
            / Unit   \         ← Component tests (30)
           /----------\
          / Validation \       ← Spec validation tests (100+)
         /--------------\
```

### Test Execution Order

1. **Spec Validation Tests** (Must pass first)
   - Run `squareColors.test.ts`
   - Verify 100% match with authoritative JSON
   - Any failure = STOP, fix world builder

2. **Unit Tests** (Second)
   - Run `coordinates.test.ts` (file mapping)
   - Run `bishopColorRules.test.ts` (validation logic)
   - Any failure = STOP, fix relevant module

3. **Integration Tests** (Final)
   - Run `bishopIntegration.test.ts`
   - Verify end-to-end behavior
   - Any failure = investigate interaction bugs

### Continuous Validation

```bash
# Run all color-related tests
npm test -- --grep "color|Color|bishop|Bishop"

# Run full test suite
npm test

# Run with coverage
npm test -- --coverage
```

**Coverage Targets:**
- `worldBuilder.ts`: 100% coverage of color assignment code
- `pieceMovement.ts`: 100% coverage of `validateBishopMove()` and `getSquareColor()`
- `coordinates.ts`: 100% coverage of `stringToFile()`

---

## Validation Checklist

### Pre-Implementation Checklist

- [ ] Read and understand the authoritative color spec in `REVISED_MEDER_COORDINATE_SYSTEM.md` Appendix 3
- [ ] Verify understanding of Raumschach vertical color alignment rule
- [ ] Review current implementation in `worldBuilder.ts`
- [ ] Review current implementation in `pieceMovement.ts`
- [ ] Identify any discrepancies between spec and implementation

### Implementation Checklist

- [ ] **World Builder**
  - [ ] Verify `createMainBoard()` uses `(file + rank) % 2`
  - [ ] Verify `createAttackBoardInstance()` uses `(file + rank) % 2`
  - [ ] Verify NO level-based color adjustments
  - [ ] Add clarifying comments about Raumschach color rule

- [ ] **File Mapping**
  - [ ] Verify `stringToFile()` maps z=0, a=1, b=2, c=3, d=4, e=5
  - [ ] Add defensive error handling
  - [ ] Add JSDoc documentation

- [ ] **Bishop Validation**
  - [ ] Verify `getSquareColor()` signature is `(file: number, rank: number): number`
  - [ ] Verify function returns `(file + rank) % 2`
  - [ ] Verify color check in `validateBishopMove()`
  - [ ] Add comprehensive JSDoc

- [ ] **Queen Validation**
  - [ ] Verify diagonal moves enforce color rule
  - [ ] Verify orthogonal moves ignore color rule

### Test Implementation Checklist

- [ ] Create `squareColors.test.ts` with 96 assertions
- [ ] Create `bishopColorRules.test.ts` with 20+ scenarios
- [ ] Update `coordinates.test.ts` with file mapping tests
- [ ] Create `bishopIntegration.test.ts` with end-to-end tests
- [ ] All tests pass locally
- [ ] All tests pass in CI (if applicable)

### Post-Implementation Checklist

- [ ] Run full test suite: `npm test`
- [ ] Verify 0 failures
- [ ] Manual testing: start game, move bishops
- [ ] Verify UI shows correct square colors
- [ ] Verify legal move highlighting respects colors
- [ ] Verify error messages are clear and helpful
- [ ] Update `CODE_ARCHITECTURE.md` with color system explanation
- [ ] Create regression test to prevent future color bugs

---

## Validation Checklist

### Manual Testing Scenarios

**Scenario 1: Light-Square Bishop**
1. Start new game
2. Move white pawn from a2W to a3W (to open diagonal)
3. Move white bishop from b1W (light) to a2W (light) ✓ Should succeed
4. Try to move bishop from a2W to a3N (dark) ✗ Should fail with clear error
5. Move bishop from a2W to b3N (light) ✓ Should succeed
6. Move bishop from b3N to c4N (light) ✓ Should succeed
7. Verify all highlighted squares during selection are light

**Scenario 2: Dark-Square Bishop**
1. Start new game
2. Move white bishop from c1W (dark) to d2W (dark) ✓ Should succeed
3. Try to move to b2W (light) ✗ Should fail
4. Verify all highlighted squares are dark

**Scenario 3: Visual Verification**
1. Start game
2. Observe square colors on W board
3. Observe square colors on N board
4. Verify that a3W (dark) and a3N (dark) are same color
5. Verify that a3N (dark) and a4N (light) are different colors
6. Verify attack board QL1: z0QL1 (dark), a0QL1 (light), z1QL1 (light), a1QL1 (dark)

---

## Rollback Plan

### If Tests Fail

1. **Identify failure point** using test output
2. **Check git diff** to see what changed
3. **Revert changes** to failing component:
   ```bash
   git checkout HEAD -- src/engine/world/worldBuilder.ts
   git checkout HEAD -- src/engine/validation/pieceMovement.ts
   ```
4. **Re-run tests** to confirm rollback successful
5. **Debug systematically**:
   - Add console logging to color calculation
   - Verify file number mapping
   - Check square ID construction
   - Verify spec interpretation

### If Manual Testing Fails

1. **Document the failure**:
   - Which square colors are wrong?
   - Which bishop moves are incorrectly allowed/blocked?
   - What are the file/rank/level values?

2. **Check intermediate values**:
   ```typescript
   console.log('File:', file, 'Rank:', rank, 'Color:', (file + rank) % 2);
   ```

3. **Verify against spec**:
   - Look up the square in authoritative JSON
   - Compare expected vs actual color
   - Trace through color calculation

4. **If widespread failures**, revert all changes and restart from Phase 1

---

## Success Criteria

### Objective Criteria

- [ ] All 96 spec validation tests pass
- [ ] All bishop color rule tests pass
- [ ] All file mapping tests pass
- [ ] All integration tests pass
- [ ] No TypeScript compilation errors
- [ ] No console errors or warnings
- [ ] Test coverage ≥ 95% for affected files

### Subjective Criteria

- [ ] Code is clear and well-documented
- [ ] Color rule is explained in comments
- [ ] Error messages are helpful to players
- [ ] Visual square colors match expectations
- [ ] Game feels correct to experienced chess players

### Performance Criteria

- [ ] Color calculation adds < 1ms to world creation time
- [ ] Color validation adds < 0.1ms per bishop move
- [ ] No performance regression in rendering

---

## Timeline Estimate

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Code review and verification | 30 minutes |
| 2 | Create test files and structure | 1 hour |
| 3 | Implement spec validation tests | 2 hours |
| 4 | Implement unit tests | 1 hour |
| 5 | Implement integration tests | 1 hour |
| 6 | Run tests and fix failures | 2 hours |
| 7 | Manual testing and verification | 1 hour |
| 8 | Documentation updates | 30 minutes |
| **Total** | | **9 hours** |

**Recommended approach:** Implement in one continuous session to maintain context and momentum.

---

## Notes

### Potential Edge Cases

1. **Attack board rotation**: Verify colors remain correct when attack boards are at 180° rotation
2. **Pin transitions**: Verify colors when attack boards move between pins
3. **Edge files (z, e)**: Verify z=0 and e=5 are correctly mapped
4. **Rank 0 and 9**: Verify edge ranks on attack boards

### Future Enhancements

1. **Visual feedback**: Highlight light/dark squares in different shades
2. **Bishop indicator**: Show which color each bishop controls in UI
3. **Educational mode**: Explain color rule to new players
4. **Color-blind mode**: Use patterns instead of colors

---

## References

- **Authoritative Spec**: `REVISED_MEDER_COORDINATE_SYSTEM.md` Appendix 3
- **Code Architecture**: `CODE_ARCHITECTURE.md`
- **Raumschach Rules**: Traditional 3D chess color alignment principle
- **Chess Programming Wiki**: Square color calculation methods
