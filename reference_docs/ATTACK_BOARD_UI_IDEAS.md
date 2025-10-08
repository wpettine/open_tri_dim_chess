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

Advanced Controls (Later)
- Rotation: Long-press attack board → radial control for 0/90/180/270° with haptic-like ticks; legal rotations glow.
- Multi-step animations: Two-phase board slide with easing; brief engine “hum” SFX (toggleable).
- Undo/preview: “Preview move” mode where board ghosts into place until confirmed.

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
- Phase 2: Drag-and-snap and ghost previews; context card.
- Phase 3: Mobile polish (thumb strip, confirm button), accessibility, reduced motion.
- Phase 4: Optional rotations, SFX, advanced overlays.
