Note: Updated to reflect corrected attack-board model: static pin footprints, 0°/180° rotation with quadrant swap only, 4×4 main-board areas, and distinct pin Z levels between main planes.
Coordinate System Overview

This project uses a board-space coordinate system (file, rank, level) that maps deterministically to world-space (worldX, worldY, worldZ) for rendering and interactions.

- Files: one-letter columns: z, a, b, c, d, e (6 columns). Lowercase letters progress left-to-right from the player perspective.
- Ranks: integers 0–9 (10 rows). Increase from the player's near edge toward the far edge.
- Levels: discrete board planes stacked vertically. Main boards occupy fixed levels; attack boards occupy pin-defined levels between/near main boards.

World mapping
- worldX = fileToWorldX(file)
- worldY = rankToWorldY(rank)
- worldZ = board/platform z-height (level), determined by the board or pin that the square is on.

Square extents and spacing are uniform; the conversion functions encode spacing and origin offsets.

Board Types
- Main boards: 6x10 boards (files z–e, ranks 0–9) at fixed vertical levels.
- Attack boards: 2x2 boards that can attach to specific “pins” around main boards. They move and optionally rotate in 90° increments; rotation affects their squares’ absolute world coordinates while maintaining the attack board’s center.

Main Boards: Initial Coordinates

Main boards are fixed at game start, each with a center and square world coordinates derived directly from fileToWorldX/rankToWorldY.

- White Main (WM): level L0 (lowest level)
  - All squares: worldZ = Z_WM (constant for white main plane)
  - Squares span files z–e, ranks 0–9
- Neutral Main (NM): level L5 (middle)
  - worldZ = Z_NM (constant)
- Black Main (BM): level L10 (highest)
  - worldZ = Z_BM (constant)

The exact Z constants come from theme/board config and are used consistently wherever a main board is rendered or queried.

Attack Boards: Initial Coordinates

There are four attack boards:
- WQL: White Queen-side Left
- WKL: White King-side Left
- BQL: Black Queen-side Left
- BKL: Black King-side Left

At start, each attack board is attached to a specific pin around its side’s main board:
- WQL attached to QL1 on WM
- WKL attached to KL1 on WM
- BQL attached to QL6 on BM
- BKL attached to KL6 on BM

Each pin defines:
- fileOffset, rankOffset: a 2x2 block location relative to the adjacent main board coordinates
- zHeight: worldZ level for the attack board’s platform and its squares

Initial attack-board squares:
- Files: two consecutive files determined by pin’s fileOffset (e.g., offset baseFile and baseFile+1)
- Ranks: two consecutive ranks determined by pin’s rankOffset (e.g., baseRank and baseRank+1)
- worldX/Y: computed via fileToWorldX/rankToWorldY for those four (file, rank) pairs
- worldZ: pin.zHeight for all four squares
- Rotation: 0° initially, so no rotated displacement is applied

Board Centers and Rotation

Each board has a geometric center:
- centerX = average of its columns’ worldX
- centerY = average of its rows’ worldY
- centerZ = platform zHeight

Rotation semantics:
- Only 0° or 180° are valid.
- A 180° flip does not change which (file, rank) cells the attack board occupies; it swaps quadrants (q1↔q3, q2↔q4) for visual/glyph orientation.
- No world-space rotation of square coordinates is performed. Squares remain exactly at fileToWorldX(file)/rankToWorldY(rank). The platform mesh may visually rotate 0 or π, but logical squares do not move.

Pin footprints and Z levels
- Each pin defines an explicit 2×2 footprint and Z:
  - Files: QLx uses [z,a] → [0,1]; KLx uses [d,e] → [4,5]
  - Ranks: as listed per pin; two consecutive ranks
  - Z: Z_L1..Z_L6 monotonically ordered between Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN

Example:
- QL1: files [0,1], ranks [0,1], z = Z_L1
- KL1: files [4,5], ranks [0,1], z = Z_L1
- QL2: files [0,1], ranks [4,5], z = Z_L2
- ...
- KL6: files [4,5], ranks [8,9], z = Z_L6
Attack Board Movement: Where Boards Should Be After Move

Moving an attack board to a new pin updates:
1) Pin binding
   - Set the board’s pin reference to the target pin (e.g., from QL1 to QL2).
2) Center position
   - Recompute centerX/centerY from the new 2x2 block determined by the pin offsets.
   - centerZ = pin.zHeight
3) Square logical positions (file, rank)
   - The 2x2 squares map to the new pin’s base file/rank:
     - files: baseFile, baseFile+1
     - ranks: baseRank, baseRank+1
4) Square absolute positions (worldX, worldY, worldZ)
   - Compute pre-rotation worldX/Y via fileToWorldX/rankToWorldY for the new (file, rank)s
   - Apply rotation around the new center using the rotation matrix above
   - Set worldZ = centerZ (pin.zHeight)

Examples (conceptual)
- WQL moves from QL1 (on WM) to QL2 (still on WM):
  - New base offsets shift the 2x2 block along the white main perimeter
  - centerX/centerY shift accordingly; Z remains Z_WM-adjacent per the pin’s zHeight
  - Squares remain the local 2x2 pattern but with new absolute coordinates, then rotated if board.rotation ≠ 0
- BKL moves from KL6 (on BM) to KL5 (toward center):
  - Pin’s zHeight remains in the black layer group (Z_BM-adjacent)
  - The 2x2 squares’ worldX/Y recomputed from the new file/rank offsets and then rotated around the updated center

Consistency Requirements

- World creation (worldBuilder) and subsequent updates (updateAttackBoardWorld) must produce identical coordinates for a given pin and rotation.
- Main boards’ squares always use direct fileToWorldX/rankToWorldY at their fixed level.
- Attack boards’ squares use pin-derived logical (file, rank) with worldZ = pin.zHeight, then rotation around center for final worldX/Y.

Testing Guidance

- Coordinate validation: Ensure board centers and square coordinates match expected positions for initial pins and after moves.
- Rotation validation: At 0°, positions match direct conversions; at 90°/180°/270°, rotated positions match rotation matrix results around the board center.
- Rendering validation: Attack-board platform and its four squares remain visually coincident after move/rotate, since both are positioned relative to the same center and rotation.

Reference
- fileToWorldX, rankToWorldY: src/engine/world/coordinates.ts
- World creation: src/engine/world/worldBuilder.ts
- Move execution and world update: src/engine/world/worldMutation.ts, src/store/gameStore.ts (updateAttackBoardWorld)
