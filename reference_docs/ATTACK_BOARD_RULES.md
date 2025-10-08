
Attack boards keep **capitalized names** (QLx / KLx) to match Meder notation.

---

## 2  Notation Syntax

| Element | Meaning | Example |
|:--|:--|:--|
| **Board (Pin)** | Location in 3D stack | `QL3` |
| **Quadrant** | Local cell on 2×2 board | `@q2` |
| **Rotation** | Orientation flag (`^0` or `^180`) | `^180` |
| **Board move** | `<from>-<to>` | `QL1-QL3` |
| **Board move + rotation** | `<from>-<to>^180` | `QL1-QL3^180` |
| **Piece enters board** | `<piece><file><rank><Board>@<q#>` | `Pb1QL1@q1` |
| **Piece leaves board** | `<piece><Board>@<q#>-<dest>` | `NQL3@q2-d5N` |
| **Composite turn** | Steps joined by `;` | `Pb1QL1@q1; QL1-QL3^180; PQL3@q3-b3W` |

---

## 3  Movement and Rotation Rules

### 3.1  Adjacency Graph
Boards move only between **adjacent pins**.  
Levels 1 & 6 → 3 neighbors; 2 & 5 → 4; 3 & 4 → 5. (See § 7.)

### 3.2  Occupancy Restriction
A board may move or rotate only if it contains ≤ 1 piece.

### 3.3  Directional Limits
- **Occupied:** forward or side only.  
- **Empty:** forward, side, or backward (“inverted”).

### 3.4  Rotation
- Flip 180° (`^180`) or return to neutral (`^0`).  
- Swaps quadrants: `q1 ↔ q3`, `q2 ↔ q4`.  
- Allowed only with ≤ 1 piece.

### 3.5  King Safety
Board moves are subject to normal check rules; a move that leaves or creates check is illegal.

---

## 4  🔸 Vertical Shadow Constraint (Article 3.1(c))

When an attack board moves or is placed so that any of its four overhanging squares would be directly above or below another piece, the move is **illegal** unless that underlying or overlying piece is a **knight**.

**Implementation rules**

- Every non-knight piece projects a “vertical shadow” through all levels of its file-rank column.  
- Attack-board quadrants cannot occupy a shadowed vertical line.  
- Knights do *not* cast vertical shadows; boards may hover above or below them.  
- Applies to forward, side, backward, and rotational moves alike.  
- Before executing a board move, check all four destination (file, rank) cells across levels; if any non-knight piece is vertically aligned, reject the move.

> Engine flag example: `blockedByShadow = true → illegal move`

---

## 5  Piece Movement Examples

| Piece | Example Sequence | Summary |
|:--|:--|:--|
| Pawn | `Pb1QL1@q1; QL1-QL3^180; PQL3@q3-b3W` | Board ride forward then exit. |
| Knight | `Nc8B-d9KL6@q2; KL6-KL5; NKL5@q2-f7N` | Knight launch. |
| Bishop | `Bd0KL1@q1; KL1-KL3^180; BKL3@q3×c4N` | Diagonal capture from board. |
| Rook | `Re0KL1@q2; KL1-QL1; QL1^180; RQL1@q3xd6B` | Side pivot and attack. |
| Queen | `Qa0QL1@q2; QL1-KL3^180; QKL3@q4-h5N+` | Lateral attack. |
| King | `Kd9KL6@q3; KL6-KL5; KKL5@q3-c8B` | Evacuation. |

---

## 6  Invalid Scenarios

| Move | Reason |
|:--|:--|
| `QL3^90` | Only 0° or 180°. |
| `QL1-QL5` | Non-adjacent pins. |
| `QL3-QL1` (occupied) | Backward while occupied. |
| `QL1xQL2` | Boards cannot capture. |
| `PQL1@q1-a3W` | No 2-step pawn after transport. |
| `QL3-KL3` (over bishop below) | ❌ Blocked by Vertical Shadow Rule. |

---

## 7  Adjacency Map (Symmetric for QL/KL)

| Board | Adjacent Pins |
|:--|:--|
| QL1 | QL2, KL1, KL2 |
| QL2 | QL1, QL3, KL1, KL2, KL3 |
| QL3 | QL2, QL4, KL2, KL3, KL4 |
| QL4 | QL3, QL5, KL3, KL4, KL5 |
| QL5 | QL4, QL6, KL4, KL5, KL6 |
| QL6 | QL5, KL5, KL6 |
| KL1 | KL2, QL1, QL2 |
| KL2 | KL1, KL3, QL1, QL2, QL3 |
| KL3 | KL2, KL4, QL2, QL3, QL4 |
| KL4 | KL3, KL5, QL3, QL4, QL5 |
| KL5 | KL4, KL6, QL4, QL5, QL6 |
| KL6 | KL5, QL5, QL6 |

*(see diagram `attack_board_adjacency.svg/png`)*

---

## 8  Engine Implementation Snippets

```ts
// Rotation map
const ROTATE_180 = { q1:'q3', q3:'q1', q2:'q4', q4:'q2' } as const;

// Shadow check
function blockedByShadow(destCells: Cell[], pieces: Piece[]): boolean {
  return destCells.some(c =>
    pieces.some(p =>
      p.type !== 'knight' &&
      p.file === c.file &&
      p.rank === c.rank &&
      p.level !== c.level // vertical alignment
    )
  );
}
