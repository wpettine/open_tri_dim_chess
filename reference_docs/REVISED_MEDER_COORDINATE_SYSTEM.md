
# Meder-Style Tridimensional Chess — Notation & Engine Schema  
**Version:** `meder-notation.v3`  
**Maintainer:** Warren Pettine  
**Last Updated:** 2025-10-09  

---

## Overview

This document defines the coordinate system, notation conventions, and logical data schemas for the **Meder-style tridimensional chess engine**.  
It describes both **spatial geometry** (main and attack boards) and **behavioral logic** (ownership, activation, and transport rules).

Key design goals:
- **No rotation math at runtime** — rotations are baked into coordinates.  
- **Dynamic board ownership** — attack boards shift control between players.  
- **Cross-track adjacency** — QL and KL boards interact symmetrically.  
- **Two-square arrival mapping** for all piece types (identity + 180° rotation).  

---

**Tridimensional Chess**, as seen in *Star Trek* and codified by Franz Joseph and later by Jens Meder, extends classical chess into **three spatial planes** and **movable 2×2 “attack boards.”**  
This document defines the **notation**, **coordinate system**, and **engine schema** for implementing the Meder rule set in a software environment, using a fully consistent coordinate model.

### 🔲 Main Boards

The game is played on **three static 4×4 “main boards”** stacked vertically:

| Symbol | Level | Description | Corners |
|--------|--------|--------------|----------|
| **W** | Lower level | White main board (base) | `a1W, a4W, d1W, d4W` |
| **N** | Middle level | Neutral board (shared plane) | `a3N, a6N, d3N, d6N` |
| **B** | Upper level | Black main board (top) | `a5B, a8B, d5B, d8B` |

Each main board behaves like a normal chessboard quadrant: pieces move across ranks and files following standard rules, but can also **transfer vertically** to a square on another level if that square exists in a vertical “shadow.”  
Thus, movement is not limited to two dimensions: it spans **rank, file, and level**.

- Example: a bishop on `b4N` can move diagonally upward to `c5B` if that square exists in the projection.  
- However, **pure vertical moves** (same file and rank, different level) are not permitted.

---

### 🪄 Attack Boards

Surrounding the three main boards are **twelve 2×2 “attack boards” (ABs)** mounted on six **Queen’s Line (QL)** pins and six **King’s Line (KL)** pins.  
Each pin represents a possible location where an attack board can “dock,” adjacent to or overlapping a main board’s edge.

Each player has **two physical attack boards** per track (one QL, one KL) that can move between pins during the game.

- **Queen’s Line (QL):** left-hand side, files `z` and `a`  
- **King’s Line (KL):** right-hand side, files `d` and `e`  

Each attack board is a fixed 2×2 square, with coordinates such as `z4QL2` or `d5KL4`.  
They can connect to main boards through **vertical adjacency (“shadow”)**, allowing pieces to move **on**, **off**, or **between** attack boards and main boards.

---

### ⚙️ Relationship Between Main Boards and Attack Boards

The **main boards** form the stable 3D “core” of the game.  
The **attack boards** act as **movable extensions** that create temporary new pathways for pieces.

Mechanically:
1. **Pieces on a main board** may move onto an overlapping attack board (if active).  
2. **Attack boards may “activate”** — shifting between pins along QL/KL tracks, carrying at most one piece (the “passenger”).  
3. **Each activation** can change ownership: a pin’s “owner” is whichever side’s board currently occupies that position.  
4. **Pieces on an attack board** can then re-enter main boards at new positions, or transfer to another attack board via activation.  

This interplay enables true 3D tactics: pieces can **ascend**, **descend**, and **lateral-hop** across levels by using the mobile 2×2 boards as bridges.

### Initial positions


* **Main boards:** `W` (White), `B` (Black) — files **a–d** only
* **Attack boards:** `QL1`/`KL1` (White side at rank 0/1) and `QL6`/`KL6` (Black side at rank 9/8) — files **z/a** on QL, **d/e** on KL
* Table rows list **higher rank on top** (e.g., for QL1: rank 1 above rank 0)

---

##### White Side

###### White Attack Board — QL1  *(files z, a; ranks 1,0)*

| Rank \ File | z                | a                 |
| ----------: | ---------------- | ----------------- |
|       **1** | Pawn — **z1QL1** | Pawn — **a1QL1**  |
|       **0** | Rook — **z0QL1** | Queen — **a0QL1** |

###### White Attack Board — KL1  *(files d, e; ranks 1,0)*

| Rank \ File | d                    | e                |
| ----------: | -------------------- | ---------------- |
|       **1** | Pawn — **d1KL1**     | Pawn — **e1KL1** |
|       **0** | **King** — **d0KL1** | Rook — **e0KL1** |

###### White Main Board — W  *(files a, b, c, d; ranks 2,1)*

| Rank \ File | a                | b                | c                | d                |
| ----------: | ---------------- | ---------------- | ---------------- | ---------------- |
|       **2** | Pawn — **a2W**   | Pawn — **b2W**   | Pawn — **c2W**   | Pawn — **d2W**   |
|       **1** | Knight — **a1W** | Bishop — **b1W** | Bishop — **c1W** | Knight — **d1W** |

---

##### Black Side

###### Black Attack Board — QL6  *(files z, a; ranks 9,8)*

| Rank \ File | z                | a                 |
| ----------: | ---------------- | ----------------- |
|       **9** | Rook — **z9QL6** | Queen — **a9QL6** |
|       **8** | Pawn — **z8QL6** | Pawn — **a8QL6**  |

###### Black Attack Board — KL6  *(files d, e; ranks 9,8)*

| Rank \ File | d                    | e                |
| ----------: | -------------------- | ---------------- |
|       **9** | **King** — **d9KL6** | Rook — **e9KL6** |
|       **8** | Pawn — **d8KL6**     | Pawn — **e8KL6** |

###### Black Main Board — B  *(files a, b, c, d; ranks 8,7)*

| Rank \ File | a                | b                | c                | d                |
| ----------: | ---------------- | ---------------- | ---------------- | ---------------- |
|       **8** | Knight — **a8B** | Bishop — **b8B** | Bishop — **c8B** | Knight — **d8B** |
|       **7** | Pawn — **a7B**   | Pawn — **b7B**   | Pawn — **c7B**   | Pawn — **d7B**   |

---


## 🧩 1. Coordinate System

### 1.1 Main Boards

| Level | Description | Corners |
|--------|--------------|----------|
| **W** | White main board (bottom) | `a1W, a4W, d1W, d4W` |
| **N** | Neutral main board (middle) | `a3N, a6N, d3N, d6N` |
| **B** | Black main board (top) | `a5B, a8B, d5B, d8B` |

- Coordinates follow `<file><rank><level>` (e.g. `b4N`).  
- Files `{z,a,b,c,d,e}`; Ranks `{0–9}`.  
- Nonexistent squares (off-footprint) are illegal.

---

### 1.2 Attack Boards (ABs)

There are **12 fixed ABs**, 6 per track (`QL`, `KL`), each 2×2.

#### Queen’s Line (QL)
| Pin | Squares |
|------|----------|
| 1 | `z0QL1, a0QL1, z1QL1, a1QL1` |
| 2 | `z4QL2, a4QL2, z5QL2, a5QL2` |
| 3 | `z2QL3, a2QL3, z3QL3, a3QL3` |
| 4 | `z6QL4, a6QL4, z7QL4, a7QL4` |
| 5 | `z4QL5, a4QL5, z5QL5, a5QL5` |
| 6 | `z8QL6, a8QL6, z9QL6, a9QL6` |

#### King’s Line (KL)
| Pin | Squares |
|------|----------|
| 1 | `d0KL1, e0KL1, d1KL1, e1KL1` |
| 2 | `d4KL2, e4KL2, d5KL2, e5KL2` |
| 3 | `d2KL3, e2KL3, d3KL3, e3KL3` |
| 4 | `d6KL4, e6KL4, d7KL4, e7KL4` |
| 5 | `d4KL5, e4KL5, d5KL5, e5KL5` |
| 6 | `d8KL6, e8KL6, d9KL6, e9KL6` |

> **Convention:**  
> - `QL` → Left side (`z/a` files)  
> - `KL` → Right side (`d/e` files)  
> - Two physical boards per track (White & Black). Ownership depends on current pin position.

---

## ⚙️ 2. Ownership and Control

| Track | White Start Pin | Black Start Pin |
|--------|----------------|----------------|
| QL | 1 | 6 |
| KL | 1 | 6 |

At runtime:
```js
owner(pin) =
  (whiteBoardPin === pin) ? "white" :
  (blackBoardPin === pin) ? "black" :
  null
````

Rules:

* One board per pin.
* Boards cannot leap or stack.
* If occupied → controller = passenger color.
  If empty → controller = board’s inherent color.
* White moves forward (increasing pin), black moves backward (decreasing pin).

---

## 🔗 3. Pin Adjacency Graph

Each pin connects to adjacent pins and their same-index counterparts on the opposite track.

<details>
<summary><b>pin_graph.json</b></summary>

```json
{
  "version": "tri-d-chess.pins.v2",
  "notes": [
    "Adjacency is undirected; if A lists B, B lists A.",
    "Pins 1&6 → 3 neighbors; 2&5 → 4 neighbors; 3&4 → 5 neighbors.",
    "QL2 does not neighbor QL5 but does neighbor KL2."
  ],
  "directionRules": {
    "whiteForward": "increasingPin",
    "blackForward": "decreasingPin"
  },
  "adjacency": {
    "QL": {
      "1": [
        { "track": "QL", "pin": 2 },
        { "track": "KL", "pin": 1 },
        { "track": "KL", "pin": 2 }
      ],
      "2": [
        { "track": "QL", "pin": 1 },
        { "track": "QL", "pin": 3 },
        { "track": "KL", "pin": 2 },
        { "track": "KL", "pin": 3 }
      ],
      "3": [
        { "track": "QL", "pin": 2 },
        { "track": "QL", "pin": 4 },
        { "track": "KL", "pin": 2 },
        { "track": "KL", "pin": 3 },
        { "track": "KL", "pin": 4 }
      ],
      "4": [
        { "track": "QL", "pin": 3 },
        { "track": "QL", "pin": 5 },
        { "track": "KL", "pin": 3 },
        { "track": "KL", "pin": 4 },
        { "track": "KL", "pin": 5 }
      ],
      "5": [
        { "track": "QL", "pin": 4 },
        { "track": "QL", "pin": 6 },
        { "track": "KL", "pin": 4 },
        { "track": "KL", "pin": 5 }
      ],
      "6": [
        { "track": "QL", "pin": 5 },
        { "track": "KL", "pin": 5 },
        { "track": "KL", "pin": 6 }
      ]
    },
    "KL": {
      "1": [
        { "track": "KL", "pin": 2 },
        { "track": "QL", "pin": 1 },
        { "track": "QL", "pin": 2 }
      ],
      "2": [
        { "track": "KL", "pin": 1 },
        { "track": "KL", "pin": 3 },
        { "track": "QL", "pin": 2 },
        { "track": "QL", "pin": 3 }
      ],
      "3": [
        { "track": "KL", "pin": 2 },
        { "track": "KL", "pin": 4 },
        { "track": "QL", "pin": 2 },
        { "track": "QL", "pin": 3 },
        { "track": "QL", "pin": 4 }
      ],
      "4": [
        { "track": "KL", "pin": 3 },
        { "track": "KL", "pin": 5 },
        { "track": "QL", "pin": 3 },
        { "track": "QL", "pin": 4 },
        { "track": "QL", "pin": 5 }
      ],
      "5": [
        { "track": "KL", "pin": 4 },
        { "track": "KL", "pin": 6 },
        { "track": "QL", "pin": 4 },
        { "track": "QL", "pin": 5 }
      ],
      "6": [
        { "track": "KL", "pin": 5 },
        { "track": "QL", "pin": 5 },
        { "track": "QL", "pin": 6 }
      ]
    }
  },
  "sanityChecks": {
    "neighborCounts": {
      "QL": { "1": 3, "2": 4, "3": 5, "4": 5, "5": 4, "6": 3 },
      "KL": { "1": 3, "2": 4, "3": 5, "4": 5, "5": 4, "6": 3 }
    }
  }
}
```

</details>

---

## 🧮 4. Activation and Direction Rules

| Board State | Allowed Directions        |
| ----------- | ------------------------- |
| Empty       | Forward / Side / Backward |
| Occupied    | Forward / Side            |

* Forward direction is color-relative.
* If a board is **occupied**, only that piece’s color may control activation.

---

## 🔁 5. Two-Square Arrival Mapping

Every piece transported via attack board has **two destination options** on the target board:

1. **Identity:** same local `(x, y)`
2. **180° rotation:** `(1-x, 1-y)`

<details>
<summary><b>arrival_mapping.json</b></summary>

```json
{
  "arrivalMapping": {
    "type": "twoOptions",
    "options": [
      { "name": "identity", "map": "local(x,y)->(x,y)" },
      { "name": "rot180", "map": "local(x,y)->(1-x,1-y)" }
    ],
    "localIndexing": {
      "QL": { "xLabels": ["z","a"], "yLabels": ["lowerRank","higherRank"] },
      "KL": { "xLabels": ["d","e"], "yLabels": ["lowerRank","higherRank"] }
    }
  }
}
```

</details>

---

## 🪜 6. Ownership Flow Example

| Step | Event           | QL Ownership             |
| ---- | --------------- | ------------------------ |
| 1    | Start           | `QL1=white`, `QL6=black` |
| 2    | White moves 1→2 | `QL2=white`, `QL6=black` |
| 3    | Black moves 6→4 | `QL4=black`, `QL2=white` |
| 4    | White moves 2→3 | `QL3=white`, `QL4=black` |
| 5    | Black moves 4→1 | `QL1=black`, `QL3=white` |

At step 5, **Black owns QL1**—even though it began as White’s pin.

---

## ⚔️ 7. Example Activations

### 7.1 Pawn Transport (QL track)

```json
{
  "track": "QL",
  "boardColor": "white",
  "fromPin": 2,
  "toPin": 5,
  "passenger": { "color": "white", "kind": "P", "square": "z4QL2" },
  "result": {
    "destinations": ["z4QL5", "a5QL5"],
    "ownershipAfter": { "QL5": "white", "QL6": "black" },
    "flags": {
      "movedByAB": true,
      "doubleStepAvailable": false,
      "enPassantEligible": false
    }
  }
}
```

**Interpretation:**
A white pawn rides QL from pin 2 to 5.
On arrival, it may occupy either `z4QL5` (identity) or `a5QL5` (rotated).
Pawn loses both its two-step advance and en passant eligibility.

---

### 7.2 Rook Transport (KL track)

```json
{
  "track": "KL",
  "boardColor": "white",
  "fromPin": 5,
  "toPin": 6,
  "passenger": { "color": "white", "kind": "R", "square": "d5KL5" },
  "result": {
    "destinations": ["d5KL6", "e8KL6"],
    "ownershipAfter": { "KL6": "white", "KL1": "black" },
    "flags": { "movedByAB": true }
  }
}
```

**Interpretation:**
A rook rides the White KL board from pin 5 → 6.
It may land on `d5KL6` (identity) or `e8KL6` (rotated 180°).

---

## 🪄 8. Pawn Rules on Attack Boards

When a pawn moves by attack-board activation:

```js
pawn.movedByAB = true;
pawn.doubleStepAvailable = false;
pawn.enPassantEligible = false;
```

Promotion, en passant, and forced-promotion edge cases apply normally, with legality determined by resulting position.

---

## 🧠 9. Implementation Notes (TypeScript)

```ts
interface TrackState {
  whiteBoardPin: number;
  blackBoardPin: number;
  passengerWhite?: Piece | null;
  passengerBlack?: Piece | null;
}

interface Piece {
  color: 'white' | 'black';
  kind: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
  square: string;
  hasMoved: boolean;
  movedByAB?: boolean;
}

type OwnershipMap = Record<number, 'white' | 'black' | null>;
```

Core rules:

* ≤ 1 board per pin per track
* Ownership = board positions
* Adjacency symmetrical across tracks
* Rotation = coordinate alias only
* Transport = 2 possible landings
* King safety always validated

---

## ✅ 10. Summary of Engine Invariants

| Category                  | Rule                                        |
| ------------------------- | ------------------------------------------- |
| **Board occupancy**       | ≤ 1 board per pin per track                 |
| **Pin ownership**         | Dynamic; based on current positions         |
| **Cross-track adjacency** | Each pin links to same and ±1 across tracks |
| **Rotation**              | Never computed dynamically                  |
| **Piece transport**       | 2 landing options                           |
| **Pawn after transport**  | No 2-step / no en passant                   |
| **King safety**           | Verified after activation                   |


Absolutely—here’s the **updated Section 11** with the clarified queenside logic where the king and rook **cross between attack boards on the back-rank bridge** (rank 0 for White, rank 9 for Black). It’s written both in plain language and as a precise, engine-ready JSON block.

---

##  11. Castling (Attack-Board Native)

## 11.1 Concept (Recap)

* In this variant, **kings and rooks start on attack boards** (QL and KL).
* **Castling is an attack-board move**, not a main-board move.
* There are **two castling modes**:

  * **Kingside**: happens entirely **within one attack board** (KL or QL).
  * **Queenside**: the king and rook **cross between attack boards** across the **back-rank bridge**:

    * **White**: between **KL1 ↔ QL1** across **rank 0**
    * **Black**: between **KL6 ↔ QL6** across **rank 9**

## 11.2 Legality Conditions (All Cases)

* **Pieces & Location**

  * King and chosen rook are on **attack boards**, **same back-rank** for that side (0 for White, 9 for Black).
  * For **kingside**, both are on the **same board** (KL or QL).
  * For **queenside**, they are on **adjacent boards** at the bridge (KL1 with QL1 for White; KL6 with QL6 for Black).
* **Eligibility**

  * Both **king** and the **involved rook** have **not moved** (`hasMoved == false`).
  * The **attack board(s)** used are **owned/controlled** by the player (board owner equals player or controller equals passenger color if occupied).
  * **No board activation** occurs during the castle (boards remain stationary).
* **Safety**

  * The **king is not in check** at the start.
  * **Path and destination** squares for the king are **not attacked**.
  * Any **required intermediate square** (if engine models the king’s move as micro-steps) is **not attacked**.
* **Capacity / Geometry**

  * Squares used for castling (king’s path and rook’s destination) must **exist** and be **empty** (except for the rook’s start square, of course).
  * **No inter-board crossing** is allowed in normal moves; **queenside castling is the sole exception**.

## 11.3 Kingside vs Queenside (Plain Language)

### Kingside (within one attack board)

* **Where:** KL or QL (whichever board contains both king and rook)
* **What happens:** King and rook **swap squares** (symmetric exchange within the same 2×2).
* **Example (White, KL1):**

  * Before: `K e0KL1`, `R d0KL1`
  * After:  `K d0KL1`, `R e0KL1`
* **Safety check:** `e0KL1` (start), `d0KL1` (end) are not attacked; king not in check beforehand.

### Queenside (across the bridge between boards)

* **Where:** **White:** KL1 ↔ QL1 across **rank 0**; **Black:** KL6 ↔ QL6 across **rank 9**
* **What happens:** King crosses **between** the boards on the shared back rank; rook crosses in the opposite direction. The move is **atomic** (single move).
* **Example (White, rank 0):**

  * Before: `K e0KL1`, `R a0QL1`
  * After:  `K a0QL1`, `R e0KL1`
* **Example (Black, rank 9):**

  * Before: `K d9KL6`, `R z9QL6`
  * After:  `K z9QL6`, `R d9KL6`
* **Safety check:** The **king’s start, any intermediate seam-adjacent square (if modeled), and destination** must not be attacked.

> Implementation note: For queenside, engines may either (a) treat the king’s movement as **direct end-to-end** across the bridge, or (b) model **two micro-steps** (e.g., `e0KL1 → d0KL1 → a0QL1`). In either case, **every square the king “touches” must be safe**.

## 11.4 Ownership & Control Requirements

* For **kingside**: the single attack board must be **controlled** by the player (occupied → controller = passenger color; empty → board owner = player).
* For **queenside**:

  * **Both** boards at the bridge (**KL1 and QL1** for White; **KL6 and QL6** for Black) must be **under the player’s control** at the moment of castling.
  * Neither board may be **activating** this turn.

## 11.5 Post-Move Effects

* The castle counts as **one king move** (special).
* **Both pieces** (`K` & `R`) set `hasMoved = true`.
* **Castling rights** for that side are **revoked**.

---

## 11.6 Structured JSON (Engine Logic)

```json
{
  "version": "tri-d-chess.castling.v4",
  "castling": {
    "location": "attackBoardsOnly",
    "modes": {
      "kingside": {
        "scope": "singleBoard",
        "eligibleTracks": ["QL", "KL"],
        "conditions": {
          "sameBoard": true,
          "unmovedKing": true,
          "unmovedRook": true,
          "boardControlledByPlayer": true,
          "boardNotActivatingThisTurn": true,
          "kingNotInCheck": true,
          "kingPathSquaresNotAttacked": true,
          "destinationSquareNotAttacked": true,
          "squaresExistAndUnoccupied": true
        },
        "movement": {
          "type": "swapOnBoard",
          "king": "swapWithRook",
          "rook": "swapWithKing"
        },
        "examples": [
          {
            "id": "white-KL1-kingside",
            "before": { "K": "e0KL1", "R": "d0KL1" },
            "after":  { "K": "d0KL1", "R": "e0KL1" }
          }
        ]
      },
      "queenside": {
        "scope": "bridgeBetweenBoards",
        "bridges": {
          "white": { "fromBoard": "KL1", "toBoard": "QL1", "rank": 0 },
          "black": { "fromBoard": "KL6", "toBoard": "QL6", "rank": 9 }
        },
        "conditions": {
          "boardsAreBridgePair": true,
          "bothBoardsControlledByPlayer": true,
          "unmovedKing": true,
          "unmovedRook": true,
          "neitherBoardActivatingThisTurn": true,
          "kingNotInCheck": true,
          "kingPathSquaresNotAttacked": true,
          "destinationSquareNotAttacked": true,
          "squaresExistAndUnoccupied": true
        },
        "movement": {
          "type": "crossBoardExchange",
          "king": {
            "from": "KLx|QLx (rank=0 white, 9 black)",
            "to":   "opposite board, same rank back-square"
          },
          "rook": {
            "from": "opposite board back-square",
            "to":   "king's former square"
          },
          "pathModel": {
            "mode": "either",
            "options": [
              {
                "id": "atomic",
                "kingPathSquares": "start,destination"
              },
              {
                "id": "microSteps",
                "kingPathSquares": "start,adjacentSeamSquareOnOriginBoard,destination"
              }
            ],
            "safetyCheck": "all kingPathSquares must be unattacked"
          }
        },
        "examples": [
          {
            "id": "white-queenside-bridge",
            "before": { "K": "e0KL1", "R": "a0QL1" },
            "after":  { "K": "a0QL1", "R": "e0KL1" }
          },
          {
            "id": "black-queenside-bridge",
            "before": { "K": "d9KL6", "R": "z9QL6" },
            "after":  { "K": "z9QL6", "R": "d9KL6" }
          }
        ]
      }
    },
    "common": {
      "effects": {
        "setHasMovedFlags": ["king", "rook"],
        "revokeCastlingRights": true
      },
      "illegality": [
        "kingInCheckAtStart",
        "pathOrDestinationAttacked",
        "boardNotControlledByPlayer",
        "boardActivatingThisTurn",
        "kingOrRookAlreadyMoved",
        "nonexistentOrOccupiedSquares",
        "bridgeBoardsNotPairedForSide"
      ],
      "errors": {
        "E_CHECK": "King is currently in check.",
        "E_PATH_ATTACKED": "At least one king path square is attacked.",
        "E_DEST_ATTACKED": "Destination square is attacked.",
        "E_MOVED": "King or rook has previously moved.",
        "E_NOT_CONTROLLED": "Required attack board is not controlled by the player.",
        "E_BOARD_ACTIVE": "Cannot castle while an involved attack board is activating.",
        "E_SQUARES": "Squares do not exist or are occupied.",
        "E_BRIDGE": "Required bridge boards (KL1↔QL1 or KL6↔QL6) are not available for this side."
      }
    }
  }
}
```

### Notes for Implementers

* **Control check**: If a board is occupied, **controller = passenger color**; if empty, **controller = board owner**. For queenside, **both boards** (the bridge pair) must satisfy control.
* **Attack detection** must include **attack-board projections** and main-board shadows that threaten any king-path square.
* **No activation** on the same turn: castling is a **piece move**, not an activation.
* **No general cross-board moves**: Only queenside castling may cross between QL and KL; all other inter-board movement uses **activation** rules.

Excellent — here’s the complete **Section 12: Pawn Promotion** written in the same structure and tone as your prior sections.
It includes clear plain-language rules *and* an engine-ready JSON schema that incorporates the dynamic overhang logic and deferred-promotion enforcement from Meder’s Article 3.4 (e)(ii–iii).

---

## 12. Pawn Promotion (Geometry-Dependent and Deferred)

## 12.1 Concept

Pawn promotion in tridimensional chess is **geometry-dependent**—the “furthest rank” is not fixed but varies by file and attack-board configuration.
Promotion may also be **deferred** if an overhanging attack board temporarily blocks a corner square from being considered “final.”
Once that board moves away, the pawn must promote automatically before any other move occurs.

---

## 12.2 When Promotion Occurs

A pawn **must** promote as part of the same move when it reaches its **furthest rank**.
The player may choose any of: **Queen, Rook, Bishop, Knight** of the same color.
Captured pieces do *not* limit this choice, and the new piece’s effect is immediate.

Promotion can also be **forced retroactively** when a blocking attack board vacates its overhanging square.

---

## 12.3 Furthest-Rank Determination Rules (by File)

| File(s)  | White Promotion Rank                       | Black Promotion Rank                       | Notes                                              |
| -------- | ------------------------------------------ | ------------------------------------------ | -------------------------------------------------- |
| **b, c** | 1                                          | 8                                          | Fixed mid-file ranks                               |
| **z, e** | 0                                          | 9                                          | Always outer edge of back-rank bridge              |
| **a, d** | 0 if attack board overhangs corner, else 1 | 9 if attack board overhangs corner, else 8 | Dynamic—depends on presence of corner attack board |

---

## 12.4 Deferred Promotion Cases

| Scenario                                                                                            | Rule                                                                                   |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Corner blocked** (`a8B`, `d8B` for White or `a1W`, `d1W` for Black) **with** attack board present | Pawn may remain unpromoted temporarily.                                                |
| **Overhang removed**                                                                                | Pawn must promote *immediately before the next move* — promotion forced automatically. |
| **Attack-board move would reveal own king to check**                                                | That attack-board move is temporarily illegal until the promotion is resolved.         |

---

## 12.5 Interaction with Attack-Board Movement

* A pawn moved **by attack-board activation** cannot promote *during* the activation itself—it only promotes once it *reaches* its furthest rank by its own subsequent move.
* Promotion checks must run **before** finalizing an attack-board move that changes board ownership on a corner square.

---

## 12.6 Structured Logic (JSON)

```json
{
  "version": "tri-d-chess.pawn-promotion.v1",
  "promotion": {
    "trigger": "pawnReachesFurthestRank",
    "eligiblePieces": ["Q", "R", "B", "N"],
    "replacementIsImmediate": true,
    "dynamicFurthestRank": {
      "rules": [
        { "files": ["b", "c"], "white": 1, "black": 8 },
        { "files": ["z", "e"], "white": 0, "black": 9 },
        {
          "files": ["a", "d"],
          "conditional": {
            "ifAttackBoardOverhangsCorner": { "white": 0, "black": 9 },
            "else": { "white": 1, "black": 8 }
          }
        }
      ]
    },
    "deferredPromotion": {
      "enabled": true,
      "triggerSquares": {
        "white": ["a8B", "d8B"],
        "black": ["a1W", "d1W"]
      },
      "conditions": {
        "attackBoardOverhangPresent": true,
        "pawnNotYetPromoted": true
      },
      "resolution": {
        "event": "attackBoardLeavesOverhang",
        "action": "autoPromoteBeforeNextMove",
        "blockingRule": "ifLeavingBoardWouldExposeKingToCheck, delayMoveUntilPromotion"
      }
    },
    "forbiddenDuringActivation": true,
    "stateFlags": {
      "pawn.movedByAB": "true → cannot doubleStep or promote on same activation"
    },
    "engineSteps": [
      "1. After every pawn move or attack-board relocation, recompute furthestRank(file).",
      "2. If pawn.square.rank == furthestRank(file) and no overhang, trigger promotion UI/event.",
      "3. If pawn on deferred square and overhang removed, trigger forced promotion before next ply.",
      "4. Block any attack-board move that would reveal own king until promotion completes."
    ],
    "errors": {
      "E_PROMOTION_REQUIRED": "Pawn reached furthest rank and must promote.",
      "E_PROMOTION_BLOCKED": "Attack board overhang prevents promotion.",
      "E_ILLEGAL_DELAY": "Player attempted to move another piece before resolving pending promotion."
    },
    "examples": [
      {
        "id": "standard-promotion",
        "pawn": "c8B",
        "file": "c",
        "color": "white",
        "furthestRank": 1,
        "promotesTo": "Q"
      },
      {
        "id": "overhang-deferred",
        "pawn": "a8B",
        "file": "a",
        "color": "white",
        "attackBoardOverhang": true,
        "status": "promotionDeferred"
      },
      {
        "id": "forced-after-overhang-leaves",
        "event": "QL6 moves away from a8B corner",
        "autoAction": "promotePawn a8B → Q before next move"
      }
    ]
  }
}
```

---

## 12.7 Implementation Summary

| Category                           | Rule                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| **Trigger**                        | Pawn reaches dynamic furthest rank                                        |
| **Deferred Cases**                 | Only corner squares blocked by overhanging attack boards                  |
| **Auto-Promotion**                 | Triggered immediately when obstruction removed                            |
| **Eligible Pieces**                | Q, R, B, N (unlimited availability)                                       |
| **Interaction with Attack Boards** | Cannot promote on same turn as activation                                 |
| **Safety Constraint**              | Attack-board move that would expose king delayed until promotion resolved |

---

Perfect — here’s the **visual + explanatory “Promotion Geometry Table”** that you can drop directly into your README under Section 12.
It clarifies how the promotion ranks depend on file geometry and attack-board overhangs for both colors.
The diagram uses **fixed coordinates** (files `z–e`, ranks `0–9`) and **labels attack board adjacency**.

---

## 12.8 📊 Promotion Geometry Table

### 12.8.1 Board Layout Overview

Below is a simplified view of the *tridimensional file–rank geometry*, showing which ranks serve as “promotion lines” for each file.
Attack boards (`QL` and `KL`) are drawn on the left (`z/a` side) and right (`d/e` side) of the main boards, while the neutral level connects the stack.

```
          ↑  Black Forward Direction
   ┌────────────────────────────────────────────┐
   │                Black Attack Boards         │
   │          (QL6)            (KL6)            │
   │          z9 a9             d9 e9           │
   │          z8 a8             d8 e8           │
   │            ↑     ↑   ↑     ↑   ↑
   │            |     |   |     |   |
   │          Promotion Ranks for Black (9)      │
   ├────────────────────────────────────────────┤
   │             Neutral Main Board (N)          │
   │          z6–a6 ... d6–e6, etc.              │
   │                  …                         │
   │             Connects W ↔ B levels           │
   ├────────────────────────────────────────────┤
   │                White Main Boards            │
   │          (QL1)             (KL1)            │
   │          z1 a1             d1 e1            │
   │          z0 a0             d0 e0            │
   │            |     |   |     |   |
   │            ↓     ↓   ↓     ↓   ↓
   │          Promotion Ranks for White (0)      │
   └────────────────────────────────────────────┘
          ↓  White Forward Direction
```

---

### 12.8.2 Promotion Rank Map by File

| File  | White Promotion Rank  | Black Promotion Rank  | Attack Board Dependency | Example Squares         | Notes                                       |
| ----- | --------------------- | --------------------- | ----------------------- | ----------------------- | ------------------------------------------- |
| **z** | 0                     | 9                     | None                    | `z0QL1`, `z9QL6`        | Always on outer QL edge.                    |
| **a** | 0 if overhang, else 1 | 9 if overhang, else 8 | ✅ Overhang-dependent    | `a0QL1`, `a8B`, `a9QL6` | Corner file, affected by QL board presence. |
| **b** | 1                     | 8                     | None                    | `b1W`, `b8B`            | Mid-file, always main board.                |
| **c** | 1                     | 8                     | None                    | `c1W`, `c8B`            | Mid-file, always main board.                |
| **d** | 0 if overhang, else 1 | 9 if overhang, else 8 | ✅ Overhang-dependent    | `d0KL1`, `d8B`, `d9KL6` | Corner file, affected by KL board presence. |
| **e** | 0                     | 9                     | None                    | `e0KL1`, `e9KL6`        | Always on outer KL edge.                    |

---

### 12.8.3 Overhang Logic (Simplified Flow)

```
IF (file == a OR file == d)
    IF (attackBoardOverhangPresent)
        promotionRank = (white ? 0 : 9)
    ELSE
        promotionRank = (white ? 1 : 8)
ELSE IF (file == z OR file == e)
    promotionRank = (white ? 0 : 9)
ELSE
    promotionRank = (white ? 1 : 8)
```

---

### 12.8.4 Deferred Promotion Examples

| Situation                                          | Square                       | Condition                               | Result |
| -------------------------------------------------- | ---------------------------- | --------------------------------------- | ------ |
| White pawn on `a8B`, QL6 board present over corner | Attack board overhang = true | Promotion deferred                      |        |
| QL6 moves away from `a8B`                          | Overhang removed             | Pawn must auto-promote before next move |        |
| Black pawn on `d1W`, KL1 overhang                  | Attack board overhang = true | Promotion deferred                      |        |
| KL1 moves away                                     | Overhang removed             | Pawn auto-promotes to chosen piece      |        |

---

### 12.8.5 Developer Notes

* The **engine** should recompute the promotion rank dynamically after any **attack-board movement**, not just pawn moves.
* When a deferred promotion becomes active (overhang removed), it must **interrupt turn flow**:
  the pawn promotes before any other action is processed.
* Promotion ranks are **asymmetric** between files because of the geometry of Meder’s layout; these ranks can change mid-game if an overhang shifts control of the corner.

---


# 12.9 Missing Promotion Plane (z/e edge when 0/9 rank doesn’t exist)

### Plain language

Sometimes the **promotion plane itself disappears** because the far attack board is not in position. This most visibly affects the **z** and **e** files, whose furthest ranks are **always** 0 (White) / 9 (Black) when they exist. If the far board is moved so that the promotion square (e.g., `z0*` for White or `z9*` for Black) **does not exist** in the current geometry:

* A pawn **cannot move** into that non-existent square (illegal move).
* The pawn’s advancement on that file is effectively **frozen** at the highest existing square (e.g., `z1*` for White / `z8*` for Black).
* Promotion is **temporarily inaccessible** but **not lost**.
  When geometry later **restores** the missing furthest rank (e.g., the attack board returns), the pawn may then move and **must promote** upon reaching it, as normal.
* If a pawn is already **sitting on** a square that becomes a promotion square due to geometry changing (e.g., overhang removed on a corner), apply the **deferred/forced promotion** rules from §12.4 immediately **before the next move**.

Key principle: **square existence** is a hard gate. If the furthest rank square doesn’t exist **right now**, you can’t enter it and therefore can’t promote on that move.

---

### Engine-ready JSON

```json
{
  "version": "tri-d-chess.pawn-promotion.missing-plane.v1",
  "missingPromotionPlane": {
    "scope": ["z", "e"],
    "furthestRank": { "white": 0, "black": 9 },
    "rules": {
      "squareExistenceIsMandatory": true,
      "illegalIfNonexistent": true,
      "advancementFrozenIfMissing": true,
      "promotionDeferredUntilRestored": true
    },
    "detection": {
      "function": "exists(squareId) -> boolean",
      "computeFurthestSquare": "furthestSquare(file=z|e, color) // e.g., z0QL1 or z9QL6 depending on geometry",
      "whenToCheck": [
        "after any attack-board activation affecting QL/KL outer edge",
        "before validating a pawn move that would enter the furthest rank"
      ]
    },
    "engineSteps": [
      "1. For any pawn on files z/e, compute target = furthestSquare(file, color).",
      "2. If !exists(target): forbid moves that land on target; mark pawn.state.promotionBlockedByMissingPlane = true.",
      "3. If exists(target) again (geometry restored): clear promotionBlockedByMissingPlane; normal promotion rules apply.",
      "4. If the pawn currently stands on a square that becomes a promotion square due to geometry change: trigger forced promotion before next move (see §12.4 deferred)."
    ],
    "uiHints": {
      "blockedBadge": "Show a small lock icon on the pawn or target square with tooltip: 'Promotion plane is currently missing.'",
      "unblockedEvent": "When plane is restored, surface a banner/toast: 'Promotion available on z0/z9 again.'"
    },
    "errors": {
      "E_NONEXISTENT_TARGET": "Cannot move: promotion square does not exist.",
      "E_ADVANCEMENT_FROZEN": "Cannot advance further on this file until promotion plane is restored."
    },
    "examples": [
      {
        "id": "z-file-missing-white",
        "color": "white",
        "pawnAt": "z1W",
        "target": "z0QL1",
        "exists(target)": false,
        "legal": false,
        "reason": "E_NONEXISTENT_TARGET"
      },
      {
        "id": "z-file-restored-white",
        "color": "white",
        "pawnAt": "z1W",
        "target": "z0QL1",
        "exists(target)": true,
        "legal": true,
        "promotionOnEntry": true
      },
      {
        "id": "e-file-missing-black",
        "color": "black",
        "pawnAt": "e8B",
        "target": "e9KL6",
        "exists(target)": false,
        "legal": false,
        "reason": "E_NONEXISTENT_TARGET"
      }
    ]
  }
}
```

---

### Dev notes

* Treat this exactly like the **corner overhang** deferral, but the trigger here is **outer-edge presence** (QL/KL at the far rank).
* Cache `exists(squareId)` results per position hash; recompute after any **attack-board activation** on the outer pins.
* This rule does **not** grant any special vertical move; usual movement legality still applies.


## Appendix 1: Initial piece locations
```
[
    { "type": "rook",   "color": "white", "file": "z", "rank": 0, "level": "QL1" },
    { "type": "queen",  "color": "white", "file": "a", "rank": 0, "level": "QL1" },
    { "type": "pawn",   "color": "white", "file": "z", "rank": 1, "level": "QL1" },
    { "type": "pawn",   "color": "white", "file": "a", "rank": 1, "level": "QL1" },
    { "type": "king",   "color": "white", "file": "d", "rank": 0, "level": "KL1" },
    { "type": "rook",   "color": "white", "file": "e", "rank": 0, "level": "KL1" },
    { "type": "pawn",   "color": "white", "file": "d", "rank": 1, "level": "KL1" },
    { "type": "pawn",   "color": "white", "file": "e", "rank": 1, "level": "KL1" },
    { "type": "knight", "color": "white", "file": "a", "rank": 1, "level": "W" },
    { "type": "bishop", "color": "white", "file": "b", "rank": 1, "level": "W" },
    { "type": "bishop", "color": "white", "file": "c", "rank": 1, "level": "W" },
    { "type": "knight", "color": "white", "file": "d", "rank": 1, "level": "W" },
    { "type": "pawn",   "color": "white", "file": "a", "rank": 2, "level": "W" },
    { "type": "pawn",   "color": "white", "file": "b", "rank": 2, "level": "W" },
    { "type": "pawn",   "color": "white", "file": "c", "rank": 2, "level": "W" },
    { "type": "pawn",   "color": "white", "file": "d", "rank": 2, "level": "W" },
    { "type": "rook",   "color": "black", "file": "z", "rank": 9, "level": "QL6" },
    { "type": "queen",  "color": "black", "file": "a", "rank": 9, "level": "QL6" },
    { "type": "pawn",   "color": "black", "file": "z", "rank": 8, "level": "QL6" },
    { "type": "pawn",   "color": "black", "file": "a", "rank": 8, "level": "QL6" },
    { "type": "king",   "color": "black", "file": "d", "rank": 9, "level": "KL6" },
    { "type": "rook",   "color": "black", "file": "e", "rank": 9, "level": "KL6" },
    { "type": "pawn",   "color": "black", "file": "d", "rank": 8, "level": "KL6" },
    { "type": "pawn",   "color": "black", "file": "e", "rank": 8, "level": "KL6" },
    { "type": "knight", "color": "black", "file": "a", "rank": 8, "level": "B" },
    { "type": "bishop", "color": "black", "file": "b", "rank": 8, "level": "B" },
    { "type": "bishop", "color": "black", "file": "c", "rank": 8, "level": "B" },
    { "type": "knight", "color": "black", "file": "d", "rank": 8, "level": "B" },
    { "type": "pawn",   "color": "black", "file": "a", "rank": 7, "level": "B" },
    { "type": "pawn",   "color": "black", "file": "b", "rank": 7, "level": "B" },
    { "type": "pawn",   "color": "black", "file": "c", "rank": 7, "level": "B" },
    { "type": "pawn",   "color": "black", "file": "d", "rank": 7, "level": "B" }
]
```
## Appendix 2: Comprehensive Test Matrix

{
  "version": "tri-d-chess.tests.matrix.v1",
  "harnessContract": {
    "api": {
      "loadPosition": "Position from JSON/FEN-like string",
      "generateLegalMoves": "returns list of moves",
      "isLegal": "validates a move",
      "apply": "mutates state",
      "undo": "reverts to previous state",
      "perft": "counts nodes to depth d"
    },
    "resultShape": {
      "legal": "boolean",
      "reason": "string | null",
      "stateDiff": "object",
      "hash": "string"
    }
  },

  "categories": [

    /* =========================
       1) Pin Graph & Ownership
       ========================= */
    {
      "id": "PIN-OWN",
      "name": "Pin adjacency, board occupancy, dynamic ownership",
      "tests": [
        {
          "id": "PIN-OWN-01-adjacency-symmetry",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 6 }, "KL": { "whiteBoardPin": 1, "blackBoardPin": 6 } },
            "adjacencySource": "pin_graph.json"
          },
          "assert": [
            "adj(QL,3) contains (KL,4) implies adj(KL,4) contains (QL,3)",
            "degree(QL,1)=3, degree(QL,2)=4, degree(QL,3)=5, degree(QL,4)=5, degree(QL,5)=4, degree(QL,6)=3"
          ]
        },
        {
          "id": "PIN-OWN-02-no-stack-or-leap",
          "given": { "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 3 } } },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 4 },
          "expect": { "legal": false, "reason": "cannot-leap-over-opposing-board" }
        },
        {
          "id": "PIN-OWN-03-dynamic-ownership-shift",
          "given": { "pins": { "QL": { "whiteBoardPin": 1, "blackBoardPin": 6 } } },
          "script": [
            { "do": { "type": "activate", "track": "QL", "boardColor": "black", "toPin": 4 } },
            { "check": { "owner(QL4)": "black" } },
            { "do": { "type": "activate", "track": "QL", "boardColor": "black", "toPin": 1 } },
            { "check": { "owner(QL1)": "black" } }
          ]
        }
      ]
    },

    /* =========================
       2) Activation (transport)
       ========================= */
    {
      "id": "ACT",
      "name": "Activation legality & transport mapping",
      "tests": [
        {
          "id": "ACT-01-occupied-forward-only",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 6 } },
            "boardPassengers": { "QL:white": { "kind": "B", "color": "white", "square": "a5QL2" } },
            "whoseTurn": "white"
          },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 5 },
          "expect": { "legal": true, "destinations": ["a5QL5","z4QL5"], "mapping": "identity|rot180" }
        },
        {
          "id": "ACT-02-occupied-backward-illegal",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 5, "blackBoardPin": 6 } },
            "boardPassengers": { "QL:white": { "kind": "R", "color": "white", "square": "z4QL5" } },
            "whoseTurn": "white"
          },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 2 },
          "expect": { "legal": false, "reason": "occupied-cannot-activate-backward" }
        },
        {
          "id": "ACT-03-piece-agnostic-transport",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 6 } },
            "boardPassengers": { "QL:white": { "kind": "N", "color": "white", "square": "z5QL2" } },
            "whoseTurn": "white"
          },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 5 },
          "expect": { "legal": true, "destinations": ["z5QL5","a4QL5"] }
        },
        {
          "id": "ACT-04-king-safety-after-activation",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 6 } },
            "boardPassengers": { "QL:white": { "kind": "N", "color": "white", "square": "a5QL2" } },
            "positions": [
              { "kind": "K", "color": "white", "square": "b4N" },
              { "kind": "Q", "color": "black", "square": "b6N" }
            ],
            "whoseTurn": "white"
          },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 5 },
          "expect": { "legal": false, "reason": "king-would-be-in-check-post-activation" }
        }
      ]
    },

    /* =========================
       3) Castling (AB-native)
       ========================= */
    {
      "id": "CSTL",
      "name": "Kingside + Queenside (bridge) castling on attack boards",
      "tests": [
        {
          "id": "CSTL-01-kingside-same-board",
          "given": {
            "pins": { "KL": { "whiteBoardPin": 1, "blackBoardPin": 6 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "e0KL1", "hasMoved": false },
              { "kind": "R", "color": "white", "square": "d0KL1", "hasMoved": false }
            ],
            "whoseTurn": "white"
          },
          "action": { "type": "castle", "side": "kingside", "track": "KL", "pin": 1 },
          "expect": {
            "legal": true,
            "after": { "K": "d0KL1", "R": "e0KL1" },
            "flags": { "K.hasMoved": true, "R.hasMoved": true }
          }
        },
        {
          "id": "CSTL-02-queenside-bridge-white",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 1 }, "KL": { "whiteBoardPin": 1 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "e0KL1", "hasMoved": false },
              { "kind": "R", "color": "white", "square": "a0QL1", "hasMoved": false }
            ],
            "whoseTurn": "white"
          },
          "action": { "type": "castle", "side": "queenside", "bridge": { "from": "KL1", "to": "QL1", "rank": 0 } },
          "expect": { "legal": true, "after": { "K": "a0QL1", "R": "e0KL1" } }
        },
        {
          "id": "CSTL-03-queenside-bridge-blocked-control",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 1 }, "KL": { "whiteBoardPin": 1 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "e0KL1" },
              { "kind": "R", "color": "white", "square": "a0QL1" }
            ],
            "controlOverride": { "bridgeBoardsControlledByPlayer": false },
            "whoseTurn": "white"
          },
          "action": { "type": "castle", "side": "queenside" },
          "expect": { "legal": false, "reason": "E_NOT_CONTROLLED" }
        },
        {
          "id": "CSTL-04-queenside-bridge-attacked-path",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 1 }, "KL": { "whiteBoardPin": 1 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "e0KL1" },
              { "kind": "R", "color": "white", "square": "a0QL1" },
              { "kind": "Q", "color": "black", "square": "d0KL1" }
            ],
            "whoseTurn": "white"
          },
          "action": { "type": "castle", "side": "queenside" },
          "expect": { "legal": false, "reason": "E_PATH_ATTACKED" }
        }
      ]
    },

    /* =========================
       4) Pawn Promotion (incl. overhang)
       ========================= */
    {
      "id": "PROMO",
      "name": "Promotion geometry, overhang deferral, forced promotion",
      "tests": [
        {
          "id": "PROMO-01-standard-bc-files",
          "given": { "positions": [ { "kind": "P", "color": "white", "square": "c1W" } ], "whoseTurn": "white" },
          "action": { "type": "pieceMove", "from": "c1W", "to": "c1W" },
          "expect": { "legal": false, "reason": "no-op" , "note": "placeholder: replace with real advance to furthest rank=1" }
        },
        {
          "id": "PROMO-02-z-file-plane-present",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 1 } },
            "positions": [ { "kind": "P", "color": "white", "square": "z1W" } ],
            "whoseTurn": "white"
          },
          "action": { "type": "pieceMove", "from": "z1W", "to": "z0QL1" },
          "expect": { "legal": true, "promotes": true, "choices": ["Q","R","B","N"] }
        },
        {
          "id": "PROMO-03-z-file-missing-plane",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 3 } },
            "positions": [ { "kind": "P", "color": "white", "square": "z1W" } ],
            "whoseTurn": "white"
          },
          "action": { "type": "pieceMove", "from": "z1W", "to": "z0QL1" },
          "expect": { "legal": false, "reason": "E_NONEXISTENT_TARGET" }
        },
        {
          "id": "PROMO-04-corner-overhang-deferred",
          "given": {
            "pins": { "QL": { "blackBoardPin": 6 } },
            "positions": [ { "kind": "P", "color": "white", "square": "a8B" } ],
            "overhang": { "a8B": true }
          },
          "expect": { "status": "promotionDeferred" }
        },
        {
          "id": "PROMO-05-forced-after-overhang-leaves",
          "script": [
            { "setup": {
              "pins": { "QL": { "blackBoardPin": 6 } },
              "positions": [ { "kind": "P", "color": "white", "square": "a8B" } ],
              "overhang": { "a8B": true }
            }},
            { "do": { "type": "activate", "track": "QL", "boardColor": "black", "toPin": 5 } },
            { "expect": { "autoPromoteBeforeNextMove": true } }
          ]
        }
      ]
    },

    /* =========================
       5) Pawn Flags (movedByAB)
       ========================= */
    {
      "id": "PAWN-FLAGS",
      "name": "movedByAB disables double-step & all EP interactions",
      "tests": [
        {
          "id": "PAWN-FLAGS-01-flag-set-on-activation",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2 } },
            "boardPassengers": { "QL:white": { "kind": "P", "color": "white", "square": "z4QL2", "hasMoved": false, "movedByAB": false } },
            "whoseTurn": "white"
          },
          "action": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 5 },
          "expect": { "legal": true, "postFlags": [{ "pieceAt": "z4QL5|a5QL5", "movedByAB": true }] }
        },
        {
          "id": "PAWN-FLAGS-02-no-double-step",
          "given": { "positions": [ { "kind": "P", "color": "white", "square": "b2W", "movedByAB": true } ], "whoseTurn": "white" },
          "action": { "type": "pieceMove", "from": "b2W", "to": "b4W" },
          "expect": { "legal": false, "reason": "double-step-disallowed-after-AB" }
        },
        {
          "id": "PAWN-FLAGS-03-en-passant-disabled",
          "given": {
            "positions": [
              { "kind": "P", "color": "white", "square": "c5N", "movedByAB": true },
              { "kind": "P", "color": "black", "square": "b5N", "movedByAB": false }
            ],
            "whoseTurn": "white",
            "epTarget": "b6N"
          },
          "action": { "type": "pieceMove", "from": "c5N", "to": "b6N", "tag": "ep" },
          "expect": { "legal": false, "reason": "ep-disallowed-when-either-movedByAB" }
        }
      ]
    },

    /* =========================
       6) Main↔AB Shadow Moves
       ========================= */
    {
      "id": "SHADOW",
      "name": "Shadow targets between main boards and attack boards",
      "tests": [
        {
          "id": "SHADOW-01-main-to-AB-legal",
          "given": {
            "shadow": "sourceOfTruthTable.json",
            "positions": [ { "kind": "N", "color": "white", "square": "b4N" } ],
            "whoseTurn": "white"
          },
          "action": { "type": "pieceMove", "from": "b4N", "to": "a4QL2" },
          "expect": { "legal": "dependsOnShadowTable", "reason": null }
        },
        {
          "id": "SHADOW-02-vertical-only-prohibited",
          "given": { "positions": [ { "kind": "B", "color": "white", "square": "c4N" } ], "whoseTurn": "white" },
          "action": { "type": "pieceMove", "from": "c4N", "to": "c4B" },
          "expect": { "legal": false, "reason": "vertical-only-prohibited" }
        }
      ]
    },

    /* =========================
       7) Check / Mate / Stalemate
       ========================= */
    {
      "id": "END",
      "name": "Check detection, checkmate, stalemate with AB geometry",
      "tests": [
        {
          "id": "END-01-check-detection",
          "given": {
            "positions": [
              { "kind": "K", "color": "white", "square": "b4N" },
              { "kind": "Q", "color": "black", "square": "b6N" }
            ]
          },
          "expect": { "whiteInCheck": true }
        },
        {
          "id": "END-02-mate-with-AB-lock",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 2, "blackBoardPin": 3 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "a1W" },
              { "kind": "R", "color": "black", "square": "a4W" },
              { "kind": "Q", "color": "black", "square": "b2W" }
            ]
          },
          "expect": { "whiteCheckmated": true }
        },
        {
          "id": "END-03-stalemate-frozen-pawn-plane",
          "given": {
            "pins": { "QL": { "whiteBoardPin": 3 } },
            "positions": [
              { "kind": "K", "color": "white", "square": "c1W" },
              { "kind": "K", "color": "black", "square": "e9KL6" },
              { "kind": "P", "color": "white", "square": "z1W" }
            ],
            "whoseTurn": "white"
          },
          "expect": { "stalemateIfNoOtherMoves": true, "note": "promotion plane missing freezes advancement" }
        }
      ]
    },

    /* =========================
       8) Serialization & Undo/Hash
       ========================= */
    {
      "id": "SER-HASH",
      "name": "Round-trip, Zobrist stability, undo integrity",
      "tests": [
        {
          "id": "SER-HASH-01-roundtrip",
          "given": { "fenLike": "custom position with AB pins + pieces" },
          "script": [
            { "do": { "type": "serialize" } },
            { "do": { "type": "deserialize" } },
            { "check": { "equalPositions": true, "equalHash": true } }
          ]
        },
        {
          "id": "SER-HASH-02-undo-integrity",
          "given": { "positions": [ { "kind": "N", "color": "white", "square": "a5QL2" } ] },
          "script": [
            { "do": { "type": "activate", "track": "QL", "boardColor": "white", "toPin": 5 } },
            { "do": { "type": "undo" } },
            { "check": { "restored": true, "hashStable": true } }
          ]
        }
      ]
    },

    /* =========================
       9) Performance / Perft
       ========================= */
    {
      "id": "PERFT",
      "name": "Reference perft baselines for engine regression",
      "notes": "Fill expected values after first correct engine; these lock in future regressions.",
      "tests": [
        {
          "id": "PERFT-01-startpos-depth1",
          "startpos": "tri-d-startpos (with AB pins and back-rank pieces per rules)",
          "depth": 1,
          "expectedNodes": "__TO_FILL__"
        },
        {
          "id": "PERFT-02-startpos-depth2",
          "startpos": "tri-d-startpos",
          "depth": 2,
          "expectedNodes": "__TO_FILL__"
        },
        {
          "id": "PERFT-03-sparse-AB-puzzle",
          "startpos": "minimal puzzle with one AB passenger",
          "depth": 3,
          "expectedNodes": "__TO_FILL__"
        }
      ]
    }
  ]
}
