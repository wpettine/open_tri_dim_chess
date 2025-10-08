
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

### ASCI Diagrams

a–d   → files (left to right)
1–4   → ranks (bottom to top)
W/N/B → main boards (White / Neutral / Black)
QLx / KLx → attack-board pins at those corners

#### White Main Board (W)
```
        ↑ rank
  4  ┌──────────────┐
     │              │
     │              │
  1  └──────────────┘
     a              d  → file
```

Corner pins:
 a1W → QL1   (Queen-side pin, White’s front-left)
 d1W → KL1   (King-side pin, White’s front-right)
 a4W → QL2   (Queen-side rear pin)
 d4W → KL2   (King-side rear pin)

#### Neutral Main Board (N)
```
     a   b   c   d
  6 [QL4] .   . [KL4]
  5   .   .   .   .
  4   .   .   .   .
  3 [QL3] .   . [KL3]

```
#### Black Main Board (B)
```
     a   b   c   d
  8 [QL6] .   . [KL6]
  7   .   .   .   .
  6   .   .   .   .
  5 [QL5] .   . [KL5]
```
#### Summary

| Vertical Layer             | Queen-side Pins | King-side Pins | Physical Description     |
| :------------------------- | :-------------- | :------------- | :----------------------- |
| **White Board (lowest)**   | QL1, QL2        | KL1, KL2       | Attack boards near White |
| **Neutral Board (middle)** | QL3, QL4        | KL3, KL4       | Mid-bridge attack boards |
| **Black Board (highest)**  | QL5, QL6        | KL5, KL6       | Attack boards near Black |

## 9 Rules in JSON

### General Move Logic

```
{
  "version": "meder-attackboard-1.0",
  "semantics": {
    "ownership": {
      "description": "Each attack board has a permanent owner (marking): white or black.",
      "values": ["white", "black"]
    },
    "control": {
      "description": "Who currently controls the board. If ≥1 piece is on the board, control = color of that piece. If empty, control = owner.",
      "values": ["white", "black"],
      "rule": "controller = (occupant ? occupant.color : owner)"
    },
    "occupancy": {
      "maxPassengers": 1,
      "movePermission": {
        "occupied": ["forward", "side"],
        "empty": ["forward", "side", "backward"]
      }
    },
    "rotation": {
      "allowedWhenPassengersAtMost": 1,
      "angles": [0, 180],
      "quadrantSwapAt180": { "q1": "q3", "q3": "q1", "q2": "q4", "q4": "q2" }
    },
    "verticalShadow": {
      "description": "No attack-board quadrant may end directly above/below any non-knight piece (same file+rank different level). Knights do not block.",
      "knightException": true,
      "enforcement": "check all 4 destination quadrants across levels"
    },
    "kingSafety": {
      "description": "Illegal to move/rotate a board if it leaves/creates check against the mover’s king.",
      "appliesTo": ["translate", "rotate"]
    },
    "adjacentOnly": true,
    "notes": [
      "Attack boards never capture; pieces do.",
      "Castling logic is separate; board rules still apply (shadow/safety)."
    ]
  },

  "directionModel": {
    "axes": {
      "column": { "values": ["QL", "KL"], "side": "side" },
      "level": { "values": [1,2,3,4,5,6], "meaning": "mounting height along a pin column" }
    },
    "forwardBackwardDefinition": {
      "controllerRelative": true,
      "homeLevel": { "white": 1, "black": 6 },
      "awayLevel": { "white": 6, "black": 1 },
      "rule": "A move within the same column (QL→QL or KL→KL) is 'forward' if it moves closer (in absolute difference) to awayLevel(controller), otherwise 'backward'. Moves QL↔KL at the same or adjacent level are 'side'."
    },
    "directionClassifier": {
      "input": { "from": "PinID", "to": "PinID", "controller": "white|black" },
      "algo": [
        "let c = controller;",
        "let fromLevel = integer(from[2]); /* e.g., QL3 -> 3 */",
        "let toLevel   = integer(to[2]);",
        "let sameColumn = (from.substring(0,2) === to.substring(0,2)); /* QL vs KL */",
        "if (!sameColumn) return 'side';",
        "let away = (c==='white'?6:1);",
        "let distFromAway = Math.abs(fromLevel - away);",
        "let distToAway   = Math.abs(toLevel   - away);",
        "return (distToAway < distFromAway) ? 'forward' : 'backward';"
      ]
    }
  },

  "policyMatrix": {
    "cases": [
      {
        "name": "Empty White-owned board",
        "owner": "white",
        "controller": "white",
        "occupied": false,
        "legalMoveDirections": ["forward", "side", "backward"],
        "notes": [
          "Empty ⇒ controller falls back to owner (white).",
          "Backward moves are allowed because board is empty."
        ]
      },
      {
        "name": "White-owned board controlled by White (has 1 white piece)",
        "owner": "white",
        "controller": "white",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Backward moves are forbidden while occupied."
        ]
      },
      {
        "name": "White-owned board controlled by Black (has 1 black piece)",
        "owner": "white",
        "controller": "black",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Direction is relative to the controller (black).",
          "Backward toward black home (level 6) is forbidden while occupied."
        ]
      },
      {
        "name": "Empty Black-owned board",
        "owner": "black",
        "controller": "black",
        "occupied": false,
        "legalMoveDirections": ["forward", "side", "backward"],
        "notes": [
          "Empty ⇒ controller falls back to owner (black).",
          "Backward moves are allowed because board is empty."
        ]
      },
      {
        "name": "Black-owned board controlled by Black (has 1 black piece)",
        "owner": "black",
        "controller": "black",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Backward toward black home (level 6) is forbidden while occupied."
        ]
      },
      {
        "name": "Black-owned board controlled by White (has 1 white piece)",
        "owner": "black",
        "controller": "white",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Direction is relative to the controller (white).",
          "Backward toward white home (level 1) is forbidden while occupied."
        ]
      }
    ],
    "rotation": {
      "appliesInAllCases": true,
      "onlyIfPassengersAtMost": 1,
      "doesNotChangeAdjacency": true,
      "updatesQuadrant": { "q1": "q3", "q3": "q1", "q2": "q4", "q4": "q2" }
    },
    "postMoveChecks": ["verticalShadow", "kingSafety"]
  },

  "adjacency": {
    "description": "Legal destinations are adjacent pins only. Use this undirected graph; direction labels are computed via directionModel.",
    "map": {
      "QL1": ["QL2","KL1","KL2"],
      "QL2": ["QL1","QL3","KL1","KL2","KL3"],
      "QL3": ["QL2","QL4","KL2","KL3","KL4"],
      "QL4": ["QL3","QL5","KL3","KL4","KL5"],
      "QL5": ["QL4","QL6","KL4","KL5","KL6"],
      "QL6": ["QL5","KL5","KL6"],
      "KL1": ["KL2","QL1","QL2"],
      "KL2": ["KL1","KL3","QL1","QL2","QL3"],
      "KL3": ["KL2","KL4","QL2","QL3","QL4"],
      "KL4": ["KL3","KL5","QL3","QL4","QL5"],
      "KL5": ["KL4","KL6","QL4","QL5","QL6"],
      "KL6": ["KL5","QL5","QL6"]
    }
  },

  "examples": {
    "forwardBackwardExamples": [
      {
        "desc": "White controls QL1 → QL2 (same column, toward away=6)",
        "controller": "white",
        "from": "QL1",
        "to": "QL2",
        "classified": "forward",
        "occupied": true,
        "legal": true
      },
      {
        "desc": "White controls QL2 → QL1 (same column, closer to home=1)",
        "controller": "white",
        "from": "QL2",
        "to": "QL1",
        "classified": "backward",
        "occupied": true,
        "legal": false,
        "why": "occupied backward not allowed"
      },
      {
        "desc": "Black controls QL6 → QL5 (same column, toward away=1)",
        "controller": "black",
        "from": "QL6",
        "to": "QL5",
        "classified": "forward",
        "occupied": true,
        "legal": true
      },
      {
        "desc": "Empty black-owned KL5 → KL6",
        "controller": "black",
        "from": "KL5",
        "to": "KL6",
        "classified": "backward",
        "occupied": false,
        "legal": true,
        "why": "empty boards may move backward"
      },
      {
        "desc": "Side move, white controls QL3 → KL3",
        "controller": "white",
        "from": "QL3",
        "to": "KL3",
        "classified": "side",
        "occupied": true,
        "legal": true
      }
    ],
    "shadowRuleExamples": [
      {
        "desc": "Blocked by vertical shadow",
        "destinationQuadrantsFilesRanks": [
          {"file":"b","rank":3}, {"file":"c","rank":3}, {"file":"b","rank":2}, {"file":"c","rank":2}
        ],
        "blockingPiece": {"type":"bishop","color":"black","file":"c","rank":3,"level":"N"},
        "result": "illegal"
      },
      {
        "desc": "Knight underneath does not block",
        "blockingPiece": {"type":"knight","color":"black","file":"c","rank":3,"level":"N"},
        "result": "legalIfOtherChecksPass"
      }
    ]
  }
}
```

### Detailed Implementation
```
{
  "version": "meder-attackboard-1.0",
  "semantics": {
    "ownership": {
      "description": "Each attack board has a permanent owner (marking): white or black.",
      "values": ["white", "black"]
    },
    "control": {
      "description": "Who currently controls the board. If ≥1 piece is on the board, control = color of that piece. If empty, control = owner.",
      "values": ["white", "black"],
      "rule": "controller = (occupant ? occupant.color : owner)"
    },
    "occupancy": {
      "maxPassengers": 1,
      "movePermission": {
        "occupied": ["forward", "side"],
        "empty": ["forward", "side", "backward"]
      }
    },
    "rotation": {
      "allowedWhenPassengersAtMost": 1,
      "angles": [0, 180],
      "quadrantSwapAt180": { "q1": "q3", "q3": "q1", "q2": "q4", "q4": "q2" }
    },
    "verticalShadow": {
      "description": "No attack-board quadrant may end directly above/below any non-knight piece (same file+rank different level). Knights do not block.",
      "knightException": true,
      "enforcement": "check all 4 destination quadrants across levels"
    },
    "kingSafety": {
      "description": "Illegal to move/rotate a board if it leaves/creates check against the mover’s king.",
      "appliesTo": ["translate", "rotate"]
    },
    "adjacentOnly": true,
    "notes": [
      "Attack boards never capture; pieces do.",
      "Castling logic is separate; board rules still apply (shadow/safety)."
    ]
  },

  "directionModel": {
    "axes": {
      "column": { "values": ["QL", "KL"], "side": "side" },
      "level": { "values": [1,2,3,4,5,6], "meaning": "mounting height along a pin column" }
    },
    "forwardBackwardDefinition": {
      "controllerRelative": true,
      "homeLevel": { "white": 1, "black": 6 },
      "awayLevel": { "white": 6, "black": 1 },
      "rule": "A move within the same column (QL→QL or KL→KL) is 'forward' if it moves closer (in absolute difference) to awayLevel(controller), otherwise 'backward'. Moves QL↔KL at the same or adjacent level are 'side'."
    },
    "directionClassifier": {
      "input": { "from": "PinID", "to": "PinID", "controller": "white|black" },
      "algo": [
        "let c = controller;",
        "let fromLevel = integer(from[2]); /* e.g., QL3 -> 3 */",
        "let toLevel   = integer(to[2]);",
        "let sameColumn = (from.substring(0,2) === to.substring(0,2)); /* QL vs KL */",
        "if (!sameColumn) return 'side';",
        "let away = (c==='white'?6:1);",
        "let distFromAway = Math.abs(fromLevel - away);",
        "let distToAway   = Math.abs(toLevel   - away);",
        "return (distToAway < distFromAway) ? 'forward' : 'backward';"
      ]
    }
  },

  "policyMatrix": {
    "cases": [
      {
        "name": "Empty White-owned board",
        "owner": "white",
        "controller": "white",
        "occupied": false,
        "legalMoveDirections": ["forward", "side", "backward"],
        "notes": [
          "Empty ⇒ controller falls back to owner (white).",
          "Backward moves are allowed because board is empty."
        ]
      },
      {
        "name": "White-owned board controlled by White (has 1 white piece)",
        "owner": "white",
        "controller": "white",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Backward moves are forbidden while occupied."
        ]
      },
      {
        "name": "White-owned board controlled by Black (has 1 black piece)",
        "owner": "white",
        "controller": "black",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Direction is relative to the controller (black).",
          "Backward toward black home (level 6) is forbidden while occupied."
        ]
      },
      {
        "name": "Empty Black-owned board",
        "owner": "black",
        "controller": "black",
        "occupied": false,
        "legalMoveDirections": ["forward", "side", "backward"],
        "notes": [
          "Empty ⇒ controller falls back to owner (black).",
          "Backward moves are allowed because board is empty."
        ]
      },
      {
        "name": "Black-owned board controlled by Black (has 1 black piece)",
        "owner": "black",
        "controller": "black",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Backward toward black home (level 6) is forbidden while occupied."
        ]
      },
      {
        "name": "Black-owned board controlled by White (has 1 white piece)",
        "owner": "black",
        "controller": "white",
        "occupied": true,
        "legalMoveDirections": ["forward", "side"],
        "notes": [
          "Direction is relative to the controller (white).",
          "Backward toward white home (level 1) is forbidden while occupied."
        ]
      }
    ],
    "rotation": {
      "appliesInAllCases": true,
      "onlyIfPassengersAtMost": 1,
      "doesNotChangeAdjacency": true,
      "updatesQuadrant": { "q1": "q3", "q3": "q1", "q2": "q4", "q4": "q2" }
    },
    "postMoveChecks": ["verticalShadow", "kingSafety"]
  },

  "adjacency": {
    "description": "Legal destinations are adjacent pins only. Use this undirected graph; direction labels are computed via directionModel.",
    "map": {
      "QL1": ["QL2","KL1","KL2"],
      "QL2": ["QL1","QL3","KL1","KL2","KL3"],
      "QL3": ["QL2","QL4","KL2","KL3","KL4"],
      "QL4": ["QL3","QL5","KL3","KL4","KL5"],
      "QL5": ["QL4","QL6","KL4","KL5","KL6"],
      "QL6": ["QL5","KL5","KL6"],
      "KL1": ["KL2","QL1","QL2"],
      "KL2": ["KL1","KL3","QL1","QL2","QL3"],
      "KL3": ["KL2","KL4","QL2","QL3","QL4"],
      "KL4": ["KL3","KL5","QL3","QL4","QL5"],
      "KL5": ["KL4","KL6","QL4","QL5","QL6"],
      "KL6": ["KL5","QL5","QL6"]
    }
  },

  "examples": {
    "forwardBackwardExamples": [
      {
        "desc": "White controls QL1 → QL2 (same column, toward away=6)",
        "controller": "white",
        "from": "QL1",
        "to": "QL2",
        "classified": "forward",
        "occupied": true,
        "legal": true
      },
      {
        "desc": "White controls QL2 → QL1 (same column, closer to home=1)",
        "controller": "white",
        "from": "QL2",
        "to": "QL1",
        "classified": "backward",
        "occupied": true,
        "legal": false,
        "why": "occupied backward not allowed"
      },
      {
        "desc": "Black controls QL6 → QL5 (same column, toward away=1)",
        "controller": "black",
        "from": "QL6",
        "to": "QL5",
        "classified": "forward",
        "occupied": true,
        "legal": true
      },
      {
        "desc": "Empty black-owned KL5 → KL6",
        "controller": "black",
        "from": "KL5",
        "to": "KL6",
        "classified": "backward",
        "occupied": false,
        "legal": true,
        "why": "empty boards may move backward"
      },
      {
        "desc": "Side move, white controls QL3 → KL3",
        "controller": "white",
        "from": "QL3",
        "to": "KL3",
        "classified": "side",
        "occupied": true,
        "legal": true
      }
    ],
    "shadowRuleExamples": [
      {
        "desc": "Blocked by vertical shadow",
        "destinationQuadrantsFilesRanks": [
          {"file":"b","rank":3}, {"file":"c","rank":3}, {"file":"b","rank":2}, {"file":"c","rank":2}
        ],
        "blockingPiece": {"type":"bishop","color":"black","file":"c","rank":3,"level":"N"},
        "result": "illegal"
      },
      {
        "desc": "Knight underneath does not block",
        "blockingPiece": {"type":"knight","color":"black","file":"c","rank":3,"level":"N"},
        "result": "legalIfOtherChecksPass"
      }
    ]
  }
}
```
{
  "version": "meder-attackboard-legalmoves-1.0",
  "pins": {
    "levels": [1,2,3,4,5,6],
    "all": ["QL1","QL2","QL3","QL4","QL5","QL6","KL1","KL2","KL3","KL4","KL5","KL6"],
    "levelIndex": {
      "QL1": 1, "QL2": 2, "QL3": 3, "QL4": 4, "QL5": 5, "QL6": 6,
      "KL1": 1, "KL2": 2, "KL3": 3, "KL4": 4, "KL5": 5, "KL6": 6
    },
    "column": {
      "QL1": "QL", "QL2": "QL", "QL3": "QL", "QL4": "QL", "QL5": "QL", "QL6": "QL",
      "KL1": "KL", "KL2": "KL", "KL3": "KL", "KL4": "KL", "KL5": "KL", "KL6": "KL"
    }
  },

  "adjacency": {
    "description": "Undirected graph of adjacent pins with edge features. deltaLevel = toLevel - fromLevel. side = true if column changes (QL↔KL).",
    "map": {
      "QL1": [
        {"to":"QL2","deltaLevel":+1,"side":false},
        {"to":"KL1","deltaLevel":0,"side":true},
        {"to":"KL2","deltaLevel":+1,"side":true}
      ],
      "QL2": [
        {"to":"QL1","deltaLevel":-1,"side":false},
        {"to":"QL3","deltaLevel":+1,"side":false},
        {"to":"KL1","deltaLevel":-1,"side":true},
        {"to":"KL2","deltaLevel":0,"side":true},
        {"to":"KL3","deltaLevel":+1,"side":true}
      ],
      "QL3": [
        {"to":"QL2","deltaLevel":-1,"side":false},
        {"to":"QL4","deltaLevel":+1,"side":false},
        {"to":"KL2","deltaLevel":-1,"side":true},
        {"to":"KL3","deltaLevel":0,"side":true},
        {"to":"KL4","deltaLevel":+1,"side":true}
      ],
      "QL4": [
        {"to":"QL3","deltaLevel":-1,"side":false},
        {"to":"QL5","deltaLevel":+1,"side":false},
        {"to":"KL3","deltaLevel":-1,"side":true},
        {"to":"KL4","deltaLevel":0,"side":true},
        {"to":"KL5","deltaLevel":+1,"side":true}
      ],
      "QL5": [
        {"to":"QL4","deltaLevel":-1,"side":false},
        {"to":"QL6","deltaLevel":+1,"side":false},
        {"to":"KL4","deltaLevel":-1,"side":true},
        {"to":"KL5","deltaLevel":0,"side":true},
        {"to":"KL6","deltaLevel":+1,"side":true}
      ],
      "QL6": [
        {"to":"QL5","deltaLevel":-1,"side":false},
        {"to":"KL5","deltaLevel":-1,"side":true},
        {"to":"KL6","deltaLevel":0,"side":true}
      ],

      "KL1": [
        {"to":"KL2","deltaLevel":+1,"side":false},
        {"to":"QL1","deltaLevel":0,"side":true},
        {"to":"QL2","deltaLevel":+1,"side":true}
      ],
      "KL2": [
        {"to":"KL1","deltaLevel":-1,"side":false},
        {"to":"KL3","deltaLevel":+1,"side":false},
        {"to":"QL1","deltaLevel":-1,"side":true},
        {"to":"QL2","deltaLevel":0,"side":true},
        {"to":"QL3","deltaLevel":+1,"side":true}
      ],
      "KL3": [
        {"to":"KL2","deltaLevel":-1,"side":false},
        {"to":"KL4","deltaLevel":+1,"side":false},
        {"to":"QL2","deltaLevel":-1,"side":true},
        {"to":"QL3","deltaLevel":0,"side":true},
        {"to":"QL4","deltaLevel":+1,"side":true}
      ],
      "KL4": [
        {"to":"KL3","deltaLevel":-1,"side":false},
        {"to":"KL5","deltaLevel":+1,"side":false},
        {"to":"QL3","deltaLevel":-1,"side":true},
        {"to":"QL4","deltaLevel":0,"side":true},
        {"to":"QL5","deltaLevel":+1,"side":true}
      ],
      "KL5": [
        {"to":"KL4","deltaLevel":-1,"side":false},
        {"to":"KL6","deltaLevel":+1,"side":false},
        {"to":"QL4","deltaLevel":-1,"side":true},
        {"to":"QL5","deltaLevel":0,"side":true},
        {"to":"QL6","deltaLevel":+1,"side":true}
      ],
      "KL6": [
        {"to":"KL5","deltaLevel":-1,"side":false},
        {"to":"QL5","deltaLevel":-1,"side":true},
        {"to":"QL6","deltaLevel":0,"side":true}
      ]
    }
  },

  "controlModel": {
    "owner": ["white","black"],
    "controllerRule": "controller = (occupied ? controllingPieceColor : owner)",
    "states": [
      { "name": "empty", "occupied": false, "controller": "owner" },
      { "name": "controlledByWhite", "occupied": true, "controller": "white" },
      { "name": "controlledByBlack", "occupied": true, "controller": "black" }
    ]
  },

  "directionRules": {
    "homeLevel": { "white": 1, "black": 6 },
    "awayLevel": { "white": 6, "black": 1 },
    "classify": {
      "description": "Given fromPin, toPin, and controller, return direction tags. Side moves are untagged (no forward/backward on side).",
      "pseudocode": [
        "let c = controller; let away = (c==='white'?6:1);",
        "let fromL = levelIndex[fromPin]; let toL = levelIndex[toPin];",
        "let sameColumn = (column[fromPin] === column[toPin]);",
        "if (!sameColumn) {",
        "  // Cross-column moves (QL↔KL) are always 'side' (no forward/backward tag).",
        "  return ['side'];",
        "}",
        "const fromDist = Math.abs(fromL - away);",
        "const toDist   = Math.abs(toL   - away);",
        "return (toDist < fromDist) ? ['forward'] : ['backward'];"
      ]
    }
  }


  "legalityPolicy": {
    "occupied": {
      "allow": ["forward", "side"],
      "denyIfIncludes": ["backward"]
    },
    "empty": {
      "allow": ["forward", "side", "backward"]
    },
    "postChecks": [
      "verticalShadow (no non-knight piece directly above/below any quadrant at destination)",
      "kingSafety (cannot leave or create check on mover’s king)"
    ]
  }

  "evaluationProcedure": {
    "steps": [
      "1) Get candidates = adjacency.map[fromPin].",
      "2) Determine controller color: controller = (occupied ? controllingPieceColor : owner).",
      "3) For each candidate, compute dirTags = directionRules.classify(fromPin, toPin, controller).",
      "4) Apply legalityPolicy:",
      "   - If occupied: reject if dirTags contains 'backward'; allow if dirTags contains 'forward' or is pure 'side'.",
      "   - If empty: allow all (forward/side/backward).",
      "5) Run postChecks: verticalShadow and kingSafety; reject if either fails.",
      "Result = set of legal destination pins."
    ]
  },

  "workedExamples": [
    {
      "owner": "white",
      "state": "empty",
      "from": "QL1",
      "controller": "white",
      "candidates": ["QL2","KL1","KL2"],
      "classification": {
        "QL2": ["forward"],
        "KL1": ["side"],
        "KL2": ["side"]
      },
      "legal": ["QL2","KL1","KL2"]
    },
    {
      "owner": "white",
      "state": "controlledByWhite",
      "from": "QL2",
      "controller": "white",
      "candidates": ["QL1","QL3","KL1","KL2","KL3"],
      "classification": {
        "QL1": ["backward"], "QL3": ["forward"],
        "KL1": ["side"], "KL2": ["side"], "KL3": ["side"]
      },
      "legal": ["QL3","KL2","KL3"]
    },
    {
      "owner": "black",
      "state": "controlledByBlack",
      "from": "QL6",
      "controller": "black",
      "candidates": ["QL5","KL5","KL6"],
      "classification": {
        "QL5": ["forward"], "KL5": ["side"], "KL6": ["side"]
      },
      "legal": ["QL5","KL5","KL6"]
    },
    {
      "owner": "black",
      "state": "controlledByWhite",
      "from": "QL5",
      "controller": "white",
      "candidates": ["QL4","QL6","KL4","KL5","KL6"],
      "classification": {
        "QL4": ["forward"], "QL6": ["backward"],
        "KL4": ["side"], "KL5": ["side"], "KL6": ["side"]
      },
      "legal": ["QL4","KL4","KL5"]
    }
  ]
}
```

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
