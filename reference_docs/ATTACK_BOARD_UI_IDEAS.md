# Attack Board UI — Ideas and Concepts

Goals
- Star Trek look-and-feel: LCARS-inspired accents, sleek transparent panels, subtle glows, diegetic controls.
- Intuitive interactions: obvious affordances, minimal modes, clear constraints.
- Mobile-friendly: thumb-reachable controls, single-hand flows, readable labels.

Core Concepts
- Boards as layers: Main boards (W/N/B) are anchored; attack boards (WQL, WKL, BQL, BKL) are movable plates shown as semi-transparent acrylic panels with colored edge glows.
- Pin rails and slots: Visualize pin positions (QL1–6, KL1–6) as rail “slots” along the board edges. Pins are labeled and glow when eligible.
- Diegetic controls: Movement is done by grabbing the attack board plate or tapping a slot; no external modal needed for basic moves.

Primary Interactions
- Drag-and-snap (desktop/tablet): Click/touch and drag an attack board; eligible slots illuminate; release to snap. Ineligible slots stay dim.
- Tap-to-place (mobile): Tap the attack board → eligible pins highlight → tap target pin to move → optional long-press to rotate if rotation is introduced later.
- Hover/press hints: Show tooltips/labels (QL3, KL4, etc.) and “legal move” directives near the finger/cursor.

Visual Language
- Color coding:
  - White side accent: warm cyan/blue glow.
  - Black side accent: amber/orange glow.
  - Neutral: violet/purple.
- Edge glows indicate interactivity; brighter = actionable.
- LCARS panels: Rounded corners, segmented bars, subtle gradients, thin scanlines.
- Faint “warp-lines” or micro-animations when boards move to suggest futuristic machinery.

State Indicators
- Board selection: Selected attack board shows a brighter rim and a soft pulsing halo.
- Legal destinations: Valid pins glow; invalid remain muted.
- Constraints shown visually:
  - If passenger piece rules constrain movement, render ghosted “no-pass-through” glyphs along blocked paths.
  - If a move would cause illegal king exposure, show a red “shield” glyph on that destination.

Mobile-first Layout
- Bottom control strip (thumb zone):
  - Attack board toggles: WQL, WKL, BQL, BKL represented as large pill buttons with color accents.
  - When active, the corresponding board highlights in 3D.
- One-handed flow:
  1) Tap attack board button to focus (board highlights).
  2) Eligible pins glow; tap a glowing pin to move board.
  3) If needed, confirm with a single “Place” button that appears inline above the strip.
- Compact labels with high contrast and generous spacing.

Accessibility
- High-contrast theme toggle for LCARS palette.
- Reduced-motion mode to limit glows and transitions.
- All pin slots and boards labeled programmatically for screen readers.

Information Hierarchy
- Always show pin labels (QLn/KLn) near slots; hide detailed adjacency unless requested.
- Context cards: small floating card shows “WQL → QL3” when previewing a move.
- Breadcrumb/status line: “Attack board: WQL • Current: QL1 • Eligible: QL2, QL3, KL1, KL2, KL3”

Safety and Clarity
- Snap previews: Before placement, board ghosts at destination with an outline of occupied squares to indicate piece carry.
- Conflict overlays: If pieces will be carried or block movement, show dashed overlays on affected squares and a short explanation.

UI Elements Summary
- Attack Board Buttons: Large, colored pills labeled WQL/WKL/BQL/BKL.
- Pin Rail Indicators: Slots along rails with glow states; numeric labels (1–6).
- Context Card: Lightweight info popover during selection/preview.
- Status Line: Minimal text showing selection and eligibility.
- Confirm Action (Mobile): Inline “Place” only when needed; otherwise auto-snap on tap.

Styling Guides
- Typography: Bold condensed headings for board IDs; clean sans serif for labels.
- Colors: LCARS-inspired swatches with subtle neon glows; prefer dark background for 3D contrast.
- Materials: Glass/acrylic look for attack boards; thin holographic edges.

Implementation Notes
- Keep interactions stateless at the UI layer: compute legal pins from engine; UI only reflects legality.
- Use existing PIN_POSITIONS and attackBoardPositions mapping; render slot markers aligned to those coordinates.
- Input handling:
  - Desktop: pointer drag with snap targets
  - Mobile: tap-to-select/tap-to-place
- Performance: Only animate the selected board; keep others idle. Use lightweight shaders for glows.

Testing Checklist
- Can select each attack board via button or direct tap.
- Legal targets glow; illegal do not.
- Tap-to-place works with a single tap path on mobile view.
- Ghost preview matches final placement.
- All labels readable on small screens.
- Reduced motion mode removes heavy animations.

Roadmap Phases
- Phase 1: Static rails and pins with highlighting; tap-to-place.
- Phase 2: Rotation UI (flip toggle/long-press), legal previews, disabled states.
- Phase 3: Drag-and-snap and context card polish.
- Phase 4: Accessibility and reduced motion refinements.
- Phase 5: Optional radial dial, SFX, advanced overlays.

## Phase 2: Rotation UI (0° / 180°)

Goal
- Enable rotating an attack board to 0° or 180° with LCARS-inspired controls that are obvious on desktop and thumb-friendly on mobile.
- Always reflect legality: rotation only when ≤ 1 piece on the board; block when vertical shadow or king safety would be violated.

Rotation Constraints (from rules)
- Allowed angles: 0° (neutral) and 180° (flip). 90°/270° are not supported.
- Legal only if the board contains ≤ 1 piece.
- Must pass Vertical Shadow Constraint (no non-knight directly above/below any of the 4 destination quadrants).
- Must not create or leave a king in check.

Primary Interaction Models
- Desktop/Tablets:
  - Flip Toggle (Default): A 2-state illuminated toggle on/near the board frame (labels: “0°” and “180°”). Clicking toggles between states.
  - Optional Radial Dial: A small LCARS dial appears when the board is selected; only two notches (0 and 180). Disabled notch is dim if illegal.
- Mobile:
  - Long-Press Carousel (Default): Long-press the selected attack board to reveal a compact 2-option carousel: [0°] [180°]. Tap to choose. Illegal option is dimmed with a tooltip (“Blocked by shadow” / “King would be in check” / “> 1 piece on board”).
  - Thumb Strip Shortcut: When an attack board is focused (WQL/WKL/BQL/BKL button active), show two large pills in the bottom strip: [0°] [180°] with glow states (enabled/disabled).

Quadrant Behavior
- Rotation swaps quadrants: q1↔q3 and q2↔q4. Update visual overlays to preview swapped positions.
- Notation:
  - Rotation in place: QL1^180
  - Move with rotation: QL1-QL3^180

Feedback & States
- Selection: Selected board has a pulsing rim. When rotation UI is active, show a subtle holographic “rotation arc.”
- Legal Previews: Hover (desktop) or first-tap (mobile) shows a ghosted board flipped to the new orientation; quadrants swap (q1↔q3, q2↔q4).
- Disabled Indicators:
  - Disabled state (dim, no glow) with a small reason: “> 1 piece on board”, “Blocked by shadow”, or “King safety violation”.
  - If the user attempts an illegal flip, gently “shake” the board and show a brief tooltip; optional soft error tone (toggleable).

Confirmation
- Desktop: Immediate on click of enabled toggle (no extra confirm).
- Mobile: Immediate on tapping enabled carousel/thumb-strip option (no extra confirm).

Animations
- Duration ~280–360ms, cubic-bezier easing.
- Board pivots around its center with a brief LCARS “energy sweep” along the edge.
- Reduced Motion Mode: Snap instantly with a brief fade; no sweeps.

Accessibility
- Keyboard: When a board is focused, press “R” to toggle rotation; Shift+R to flip back. Announce via aria-live (“Rotation: 180° (allowed)” or reason if blocked).
- Screen Reader Labels: Flip toggle is an ARIA button with state “pressed” when at 180°; tooltips aria-described-by the control.
- High Contrast Mode: Replace glows with solid high-contrast outlines.

Mobile Specifics
- Hit Targets: ≥44×44px. Generous spacing to prevent accidental taps.
- One-Handed Flow:
  1) Tap WQL/WKL/BQL/BKL to focus the board.
  2) Long-press the board or use bottom [0°]/[180°] pills.
  3) If illegal, an in-context explainer appears above the control; else, it flips.

Engine Hooks & Validation
- Before enabling a rotation choice:
  - Check occupancy (≤ 1 piece).
  - Compute post-rotation quadrant mapping (q1↔q3, q2↔q4) and resulting world squares.
  - Apply Vertical Shadow check across all 4 destination (file, rank) cells and across levels.
  - Apply king safety (simulate rotation or ask engine).
- UI calls engine via canRotate(boardId, angle) → { allowed: boolean, reason?: string }.

Edge Cases
- Exactly 1 passenger piece: allowed (still subject to shadow & king safety).
- 2+ pieces: disabled with “> 1 piece” reason.
- Rotation cannot capture; any vertical conflicts fall under the shadow rule (illegal).
- If mid drag-and-snap preview, temporarily disable rotation controls until placed.

Testing Checklist — Rotation
- Desktop: click flip toggle to 180° and back; UI and move history reflect ^180/^0.
- Mobile: long-press → carousel; tap enabled option flips; disabled shows reason.
- Occupancy: with 2 pieces on the attack board, rotation controls are disabled.
- Shadow: place a rook directly below a would-be quadrant; rotation disabled with correct reason.
- King safety: rotation that would expose the king is disabled.
- Reduced motion: flip snaps without animation.
- Accessibility: keyboard toggle works; screen reader labels/announcements correct.

LCARS Styling Notes
- Controls: Rounded pill buttons with segmented bars; accent colors:
  - White-side boards: cyan/blue
  - Black-side boards: amber/orange
  - Neutral cues: violet/purple
- Overlays: Thin holographic arc indicating rotation; brief “energy sweep” on flip.
