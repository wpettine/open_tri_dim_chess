Coordinate System Explained

Purpose
This document explains, in plain language, how the game’s coordinates work and how attack boards move and rotate under the current implementation.

Core Concepts
- Board-space vs. world-space
  - Board-space: file, rank, level
    - file: the column index (0–5) corresponding to z, a, b, c, d, e
    - rank: the row index (0–9)
    - level: which board the square belongs to (White main, Neutral main, Black main, or an attack board)
  - World-space: worldX, worldY, worldZ used for rendering
    - worldX and worldY are computed directly from file and rank via shared helpers
    - worldZ is the board’s platform height

- Main boards are 4×4 playable areas
  - The global grid is 6 files × 10 ranks, but only a 4×4 area per main board is playable.
  - Squares outside the 4×4 on a main plane are considered non-existent for movement/placement.

- Attack boards are 2×2
  - Each attack board always occupies exactly four adjacent squares: two side-by-side files × two ranks.

World Mapping (how we place things)
- worldX = fileToWorldX(file)
- worldY = rankToWorldY(rank)
- worldZ = the platform height for the board or pin it sits on

No ad-hoc math is embedded in placement logic; all spacing comes from the central conversion helpers.

Rotation Rules for Attack Boards
- Allowed rotations: only 0° or 180°.
- A 180° rotation does not move the four squares. The same four (file, rank) cells remain occupied.
- Instead of rotating coordinates, we swap the quadrants (q1↔q3, q2↔q4) so visual orientation flips without any drift or off-grid placement.
- The platform mesh may visually rotate by π (180°), but the square coordinates are unchanged.

Static Pin Footprints (authoritative placement)
- We use a single, static lookup table (PIN_FOOTPRINT) that defines, for each pin:
  - The exact two files [f0, f1] the board uses there
  - The exact two ranks [r0, r1] the board uses there
  - The z-height for that pin (between main planes)
- On every move to a pin, the board’s four squares are placed using that pin’s footprint. We do not slide or derive offsets.

Side Moves Swap File Pairs
- When moving between Queen-line (QLx) and King-line (KLx) pins on the same level, the file pair changes according to the footprint table.
- We do not “shift” the old files; we replace them with the target pin’s files/ranks exactly.

Distinct Z Levels for Pins
- Pins live at distinct z-heights ordered between the three main planes.
- The order is monotonic from the White side upward, through Neutral, to Black.
- Each pin has a unique Z so stacked boards look correct and shadow/overlap checks work cleanly.

Putting It Together: How an Attack Board Move Works
- When an attack board moves to a new pin:
  1) We look up the new pin’s footprint to get files [f0, f1], ranks [r0, r1], and z.
  2) We set the board’s center from those four cells and set worldZ = footprint.z.
  3) We set each of the four squares to exactly those (file, rank), then compute worldX/Y from the shared helpers.
  4) If the move includes a 180° rotation, we swap quadrants only; the (file, rank) cells stay the same.

Passenger Pieces on Moving Boards
- Pieces riding an attack board are remapped by quadrant index:
  - We find which of the four cells (indices 0..3) the piece is on at the source pin.
  - We map that index to the destination pin’s corresponding cell.
  - If the move includes a 180° rotation, we swap the index using (q1↔q3, q2↔q4) before mapping.
- This guarantees pieces land exactly on one of the four destination cells defined by the new footprint.

Why This Is Robust
- No world-space rotation math is applied to squares, so there is no floating-point drift.
- Placement is deterministic and comes from one authoritative source (the static footprint table).
- Sideways moves correctly switch file pairs because they always re-read the target pin’s files/ranks.
- Visual rotation and logical coordinates are decoupled, preventing alignment issues.

Quick Glossary
- file: column index (0–5) → z,a,b,c,d,e
- rank: row index (0–9)
- level: which board (main or attack board) a square belongs to
- footprint: the 2×2 set of files/ranks and the z-height for a pin
- quadrant: one of the four cells of a 2×2 board; used for rider remapping and visual orientation
