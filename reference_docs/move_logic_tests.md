# A Formal Specification of

# Tri-Dimensional Chess Mechanics for

# Automated Test Generation (Based on

# Meder's Tournament Rules)

## Introduction: Purpose and Scope

This document provides a complete and unambiguous specification of Jens Meder's
Tournament Rules for Tri-Dimensional Chess.^1 Its primary purpose is to serve as a canonical
reference for the development and validation of a game-playing and testing agent. The
specification prioritizes logical rigor and implementational clarity over historical context or
strategic advice.
The choice of Meder's rules is deliberate. This rule set was developed as a direct extension of
the FIDE Laws of Chess, with the explicit goal of creating a balanced, clear, and competitively
viable variant.^1 This FIDE-aligned structure provides an internal consistency that is well-suited
for algorithmic translation. Furthermore, Meder's "Tournament Rules" have been adopted as
the de facto standard for most modern software implementations of the game, largely due to
their public availability and logical precision.^1 This ensures that any agent built from this
specification will be compatible with the established digital ecosystem, allowing for valid
comparison and interaction with existing programs.

## Section 1: The Game Environment: Board,

## Coordinates, and Initial Configuration

This section defines the static and dynamic elements of the gamespace. A precise
understanding of the coordinate system is a prerequisite for parsing or generating any move,


making this the foundational layer of the entire specification.

### 1.1 Board Composition and Nomenclature

The game is played on a set of seven distinct boards, comprising three fixed main boards and
four movable attack boards.^1
● **Main Boards** : Three fixed 4x4 main boards (16 squares each).
○ Lowest Board: **White's Board (W)**
○ Middle Board: **Neutral Board (N)**
○ Highest Board: **Black's Board (B)**
● **Attack Boards** : Four movable 2x2 attack boards (4 squares each).
○ Two start attached to White's Board, designated **White's Queen's Level (WQL)** and
**White's King's Level (WKL)**.
○ Two start attached to Black's Board, designated **Black's Queen's Level (BQL)** and
**Black's King's Level (BKL)**.
These designations are based on their starting side of the board and are essential for notation
and rule application.^4

Premise: This logic assumes each board is 4 units deep. The only change is to the Y-coordinates of the middle and top boards.

Board 1: White's Main Board (Bottom)

Center Position: (X=0, Y=0, Z=0)

Board 2: Neutral Main Board (Middle)

Center Position: (X=0, Y=2, Z=4)

Logic: The Y-coordinate is now 2 (instead of 4). This shifts the board back so it overlaps with the front half of the board below it.

Board 3: Black's Main Board (Top)

Center Position: (X=0, Y=4, Z=8)

Logic: The Y-coordinate is now 4 (instead of 8). This maintains the same 2-unit forward shift from the Neutral board, creating an overlap.

#### Verification Check
When viewed from directly above, the Neutral board should cover the front half of the White board, and the Black board should cover the front half of the Neutral board.

### 1.2 The Coordinate System

A three-dimensional algebraic notation is used to uniquely identify every square. The system
must account for files, ranks, and levels.
● **Files** : The vertical columns, viewed from a top-down perspective, are designated **z, a, b,
c, d, e**.^4 This six-file system accommodates the horizontal offset of the main boards,
which together form a virtual 8x4 playing area.^1
● **Ranks** : The horizontal rows are numbered **0 through 9**.^4 This ten-rank system is
necessary to account for the potential overhang of attack boards, which can be
positioned beyond the primary ranks of the main boards.^1
● **Levels** : A letter code designates the specific board a square resides on: **W, N, B, WQL,
WKL, BQL, BKL**.
A complete coordinate is expressed as <file><rank><level>, for example, c1W or a8BQL. The
design of this coordinate system implies that the game logic cannot use a simple (x, y, z)
integer grid without a complex mapping layer. The logic must be aware of "non-existent


squares" at certain coordinates.^1 For instance, a move to
b1N is invalid because the Neutral board does not cover rank 1. A comprehensive test suite
must include negative test cases to validate that the engine correctly identifies and rejects
moves to or from these "ghost" squares.

### 1.3 Initial Piece Configuration

Each player begins with 16 standard chess pieces and controls two attack boards.^1 The exact
starting positions are critical for validating the initial board state. The following table provides
the definitive configuration, translating the official visual setup into a machine-readable
format to establish a reliable baseline for testing.
**Table 1: Initial Piece Configuration (White and Black)**
Piece Color Starting Coordinate
King White b1W
Queen White c1W
Rook White z0WQL
Rook White e0WKL
Bishop White a2W
Bishop White d2W
Knight White b2W
Knight White c2W
Pawn White z1WQL, a1WQL, b3W, c3W,
d3W, e3W, z1WKL, e1WKL


```
King Black c8B
Queen Black b8B
Rook Black z9BQL
Rook Black e9BKL
Bishop Black a7B
Bishop Black d7B
Knight Black b7B
Knight Black c7B
Pawn Black z8BQL, a8BQL, b6B, c6B,
d6B, e6B, z8BKL, e8BKL
```
## Section 2: Global Rules of Engagement

This section covers the universal principles that constrain all actions. These rules form the
core logic of the game engine's turn-based state machine.

### 2.1 Turn Structure: The Fundamental Dichotomy

A player's turn consists of executing **one and only one** of the following actions 1 :

1. Making a legal move with a single piece.
2. Making a legal move with a single attack board.
This choice is mutually exclusive; a player cannot move a piece and an attack board in the
same turn. This rule introduces a significant strategic consideration related to tempo. Altering
the board's geometry by moving an attack board is a powerful action that can create future


opportunities or neutralize threats. However, it comes at the cost of a full turn, during which a
player forgoes the chance to develop a piece, create a direct attack, or respond to an
opponent's maneuver. Test cases must validate that the game state correctly rejects any
attempt to perform both actions in one turn. Furthermore, scenarios should be constructed
where a board move is the only legal or strategically viable option, confirming the engine
correctly identifies and permits this alternative.

### 2.2 The "Vertical Shadow" Principle of Obstruction

This is the single most important rule distinguishing Tri-D Chess from its 2D ancestor.
● **Definition** : A piece occupying any square (e.g., c4N) blocks the entire vertical column
associated with that square's file and rank (c4) for all other pieces on all levels.^1
● **Effect** : An opposing piece cannot move _through_ this blocked column, even if the path on
its own level is clear. For example, a White Bishop on a2W cannot move to d5N if a Black
Pawn occupies b3W or b3N.
● **Exception** : The Knight is explicitly exempt from this rule, as its move is a "leap" and not a
traversal.^1
This principle transforms the strategic value of all pieces, particularly pawns. In standard
chess, a pawn's influence is limited. In Meder's Tri-D Chess, a single pawn on a central square
like c4N projects a "shadow" upwards and downwards, which can completely immobilize an
opponent's Rook or Bishop on a different level.^1 This elevates pawns to powerful spatial
control assets. A critical validation for any testing agent is to construct a scenario where a
long-range piece's move is attempted and correctly invalidated solely due to an intervening
piece several levels away in the same vertical column.

### 2.3 Prohibition of Purely Vertical Movement

A piece cannot move from a square on one level to the exact same file/rank square on an
adjacent level if there is no horizontal displacement.^1
For example, a Rook on b2W cannot legally move to b2N. However, a Bishop on b2W can
legally move to c3N, as this involves both horizontal and vertical displacement. This rule
prevents pieces from simply hopping between levels without engaging with the horizontal
dimensions of the game.


## Section 3: Piece-Specific Movement Protocols and

## Scenarios

This section provides a granular definition for each piece type. Each subsection serves as a
self-contained specification for implementing and testing a single piece's logic.

### 3.1 Rook (R)

```
● Movement : Moves any number of unoccupied squares along a rank or file. Its path can
cross between boards as long as it remains on a straight line and the intermediate
squares on the path are geometrically valid.^1
● Constraints : The path must be clear of all other pieces. The Rook is blocked by the
Vertical Shadow rule.
● Test Scenarios :
○ Valid : R@a2W moves to a7B. The path (a3N, a4N, a5B, a6B) must be clear, and no
pieces may exist in the a3, a4, a5, or a6 columns on any level.
○ Invalid : R@a2W attempts to move to a7B, but a piece exists at a4N.
○ Invalid : R@a2W attempts a purely vertical move to a2N, violating the rule from
Section 2.3.
```
### 3.2 Bishop (B)

```
● Movement : Moves any number of unoccupied squares diagonally. Its path can cross
between boards.^1
● Constraints : The path must be clear. The Bishop is blocked by the Vertical Shadow rule.
● Test Scenarios :
○ Valid : B@a2W moves to d5N. The path (passing through the b3 and c4 columns)
must be clear on all levels.
○ Invalid : B@a2W attempts move to d5N, but a piece exists at c4W, blocking the
vertical column.
```

### 3.3 Queen (Q)

```
● Movement : Combines the movement of a Rook and a Bishop.^1
● Constraints : Subject to the same constraints as the Rook and Bishop.
● Test Scenarios : A combination of Rook and Bishop scenarios should be used to validate
Queen movement.
```
### 3.4 King (K)

```
● Movement : Moves one square in any direction (rank, file, or diagonal), including to an
adjacent square on a different level.^1
● Constraints : Cannot move into a square attacked by an enemy piece (check).
● Test Scenarios :
○ Valid : K@b1W moves to c2W, b2W, a2W, or c2N.
○ Invalid : K@b1W attempts to move to c2N, but c2N is attacked by an enemy piece.
```
### 3.5 Knight (N)

● **Movement** : Moves in an "L" shape: two squares along a rank or file, then one square
perpendicularly. This leap can cross levels.^1
● **Constraints** : The Knight is the only piece that **ignores** the Vertical Shadow rule. It can
jump over any intervening pieces.^1
The Knight's immunity to the Vertical Shadow rule elevates its relative value significantly
compared to standard chess. While the operational range of Queens, Rooks, and Bishops is
severely constrained by vertical chokepoints, the Knight can project threats onto boards that
are otherwise inaccessible. A single Knight can simultaneously attack key squares on three
different levels, creating complex forks that are impossible for other pieces to execute in
congested positions. Test suites must heavily feature scenarios with cluttered multi-level
positions to confirm a Knight can successfully complete a move while other pieces, with
theoretically clear paths on their own 2D planes, are correctly blocked.
● **Test Scenarios** :
○ **Valid** : N@b2W moves to c4N, even if squares b3W, b3N, c3W, and c3N are all
occupied.
○ **Valid** : N@b2W moves to d3W.


```
○ Invalid : N@b2W attempts to move to d4N (not a valid L-shape).
```
### 3.6 Pawn (P)

The Pawn has the most complex and state-dependent rules of any piece.
● **Initial Move** : From its starting square, a pawn may advance one or two squares forward
along its file, provided the path is clear.^1
● **Subsequent Move** : After its initial move, a pawn may only advance one square forward.
● **Capture** : Captures one square diagonally forward. This can be to a square on a different
level.^1
● **Loss of Privilege** : A pawn that has been moved as a "passenger" on an attack board
permanently loses its initial two-square move option.^1 This state must be tracked for each
pawn.
● **Promotion** : Occurs when a pawn reaches the "furthest rank." The pawn must be
promoted to a Queen, Rook, Bishop, or Knight of the same color.^1 The promotion rank is
dynamic and depends on the position of the attack boards.
The concept of a dynamic goal state is computationally non-trivial. Unlike 2D chess where the
promotion rank is fixed, here it must be recalculated based on the board state. The logic in
the following table is essential for any isPromotionSquare() function.
**Table 2: Dynamic Pawn Promotion Ranks**
File(s) Player Condition Promotion Rank
b, c White Always 8
b, c Black Always 1
z, a, d, e White Attack board
attached to Black's
board on the same
file

##### 9

```
z, a, d, e White No attack board
attached
```
##### 8


```
z, a, d, e Black Attack board
attached to White's
board on the same
file
```
##### 0

```
z, a, d, e Black No attack board
attached
```
##### 1

## Section 4: Core Mechanic Analysis: Attack Board

## Manipulation

This section isolates the rules for the game's most unique feature. Correctly implementing
attack board logic is essential for a compliant game engine.

### 4.1 Conditions for Movement

An attack board can be moved if it is occupied by **no more than one piece**. The piece can be
of **any type or color**.^1

### 4.2 Control of Movement

● If the board is occupied by a single piece, the player who owns that piece controls the
board's movement for that turn.^1
● If the board is empty, its original owner controls its movement.^1
These rules create a "temporary hijack" mechanic. If White moves a piece onto an otherwise
empty attack board owned by Black, White gains control of that board's movement for their
next turn. This allows a player to use a piece not just to attack, but to capture the mobility of
the opponent's terrain. A critical test sequence must validate this: Player A moves a piece to
Player B's board. On Player A's next turn, the test must confirm that a move of Player B's
board is listed as a legal option for Player A.


### 4.3 Method of Movement

An attack board moves like a **Rook** along the grid of available pins.^1 It can move to any
"adjacent" pin, with adjacency being defined by the physical layout of the game set. A board
on the Neutral level has more adjacent pins than one on the White or Black levels.^1

### 4.4 Directional Constraints

This is a critical and subtle rule governing board movement.
● **Occupied Boards** : Can only move **forward or sideways** relative to the controlling player.
They cannot be moved backward.^1
● **Empty Boards** : Can be moved **forward, sideways, or backward** to an inverted pin
position underneath a main board.^1
The logic for board movement depends on three inputs: occupancy, owner of the occupying
piece, and the player whose turn it is. The following table summarizes these conditions.
**Table 3: Attack Board Movement Conditions**
Board Occupancy Controlling Player Legal Move Directions
Empty Original Owner (White) Forward, Sideways,
Backward (Invert)
Empty Original Owner (Black) Forward, Sideways,
Backward (Invert)
Occupied by 1 White Piece White Forward, Sideways
Occupied by 1 Black Piece Black Forward, Sideways
Occupied by 1 White Piece Black No move possible


```
Occupied by 1 Black Piece White No move possible
Occupied by >1 Piece N/A No move possible
```
## Section 5: Special Moves and Game State Resolution

This section details the complex, conditional moves and the ultimate objectives of the game.
These rules often involve multiple preconditions and are prime candidates for edge-case
bugs.

### 5.1 Castling

```
● Objective : As in FIDE chess, to improve King safety and develop a Rook.
● Conditions : The standard FIDE castling conditions apply: neither King nor Rook has
moved; the path between them is clear; the King is not in check and does not pass
through or land on an attacked square.^1
● Execution : The rules are meticulously defined to account for the King and Rook starting
on different boards or ranks. For the standard setup, on the king's side, the King and
Rook exchange places. On the queen's side, the King moves next to the Rook, and the
Rook moves to the square the King vacated.^1
```
### 5.2 En Passant

● **Condition** : An opponent's pawn advances two squares from its starting position, landing
adjacent to one of your pawns. The capture is only legal on the immediately following
turn.^1
● **Execution** : The capture is performed as if the enemy pawn had only moved one square.
● **3D Application** : The capturing pawn has the **option to land on any valid level** at the
destination square, provided the path is clear.^1
This 3D-specific extension creates a novel tactical choice. A single _en passant_ capture can
simultaneously achieve three goals: (1) remove an enemy pawn, (2) control the destination
square, and (3) reposition the capturing pawn to a more advantageous board (e.g., moving


from White's home board to the contested Neutral board). This transforms a niche rule into a
powerful tool for development. Test cases must generate _en passant_ scenarios where the
destination square is valid on multiple levels (e.g., c3W and c3N) and validate that the game
allows the player to choose between these destinations.

### 5.3 Game State Resolution

● **Check** : A King is in check if it is under attack by one or more enemy pieces.
● **Checkmate** : A player is in checkmate if their King is in check and there are no legal
moves to escape the check. The player who delivers checkmate wins the game.^1
● **Stalemate** : A player is in stalemate if it is their turn to move, they are not in check, but
they have no legal moves. The game is a draw.^1
The agent's functions for determining checkmate and stalemate must be robust. A critical
edge case arises from the turn dichotomy: a player might be able to escape check not by
moving their king, but by moving an attack board to block the line of attack. The game state
resolution logic must iterate through every possible piece move _and_ every possible board
move for the current player to be considered correct.

## Appendix: Comprehensive Test Scenario Matrix

For the practical implementation of a testing agent, a comprehensive matrix of test scenarios
should be developed. This matrix will serve as the ground truth for validating the game
engine's compliance with the rules specified in this document. It should be structured for easy
parsing by an automated test generation script.

### Structure

Each row in the matrix will represent a single, atomic test case. The following columns are
recommended:
● **TestCaseID** : A unique identifier (e.g., PAWN_PROMO_001).
● **Description** : A human-readable summary of the test's purpose (e.g., "Tests pawn
promotion to Queen on outer file when attack board is present").


### Example Test Cases
| ID | Description | Expected Result |
|----|--------------|-----------------|
| T-KING_001 | King attempts pure vertical move (b1W→b1N) | Illegal |
| T-PAWN_001 | Pawn two-step forward crossing a level (b3W→b5B) with clear path | Legal |
| T-ATTACK_001 | Attack board moves two adjacencies in one turn | Illegal (must move one step only) |
| T-EP_001 | En passant available on two potential destination levels; one blocked | Capture succeeds on valid level, fails on blocked one |


```
● InitialStateFEN : A Forsyth-Edwards Notation (FEN) like string representing the required
board state. A custom FEN format will be required to handle the multi-board layout and
piece positions.
● MoveToTest : The specific move being validated (e.g., P@a8BQL-a9BQL=Q).
● ExpectedResult : VALID or INVALID.
● RuleCitation : The specific rule section from this document that justifies the expected
result (e.g., "Section 3.6, Table 2").
```
### Content Categories

The matrix must include a wide range of scenarios covering all aspects of the rules, including
but not limited to:
● Basic valid and invalid movement for all pieces on all board types.
● Scenarios specifically designed to test the Vertical Shadow blocking principle for Rooks,
Bishops, and Queens.
● Knight moves in congested spaces to confirm immunity to the Vertical Shadow.
● All pawn special rules: initial two-square move, capture, promotion under all conditions in
Table 2, _en passant_ with level choice, and loss of the two-square move privilege after
being a passenger.
● All conditions for attack board movement from Table 3, including empty, occupied,
directional constraints, and the "hijack" mechanic.
● Valid and invalid castling attempts under various threat conditions.
● Game-ending states: clear checkmates, stalemates, and scenarios where a board move is
the only escape from check.
● Negative tests for moves to, from, or through non-existent "ghost" squares in the
coordinate system.