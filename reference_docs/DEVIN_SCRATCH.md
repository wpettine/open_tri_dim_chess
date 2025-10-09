# Devin Scratchpad – Phase I Execution Notes

Scope: Implement Phase I from NEW_WORLD_STRUCTURE.md (data structures + world instances + visibility), keep notes actionable for me.

Checklist (live):
- [ ] Add/confirm types: TrackState, PinAdjacencyGraph, BoardInstance (track, pin, rotation), Piece.movedByAB
- [ ] World builder: PIN_RANK_OFFSETS, PIN_ADJACENCY, create 24 attack instances, instance IDs {Track}{Pin}:{Rotation}
- [ ] Game state: trackStates/attackBoardStates, initialize defaults, updateInstanceVisibility()
- [ ] Tests: world counts, naming, initial visibility, state init

Repo scan summary:
- Will scan for existing src/engine/world/* and store files before edits.
- If code not present yet (doc-first repo), I will stage type stubs and world builder scaffolding to align with Phase I.

Decisions:
- Use instance naming “QLn:0/180”, “KLn:0/180” consistently across world and state.
- Keep mutations isolated: visibility toggling only; no physical transforms.

Open Questions (to self):
- Confirm whether existing GameState exists; if not, create minimal state scaffolding local to world module for tests.

Work log:
- [T0] Initialized Phase I plan and checklist here.
- [T1] Added Phase I scaffolding: extended types, attached adjacencyGraph in worldBuilder, optional trackStates in GameState, helper tests created.

Decision on legacy tests (Phase I):
- Per Warren: Ignore failing legacy attack-board tests for now; they will be reworked for the new visibility-based system.
- Main board-related tests remain relevant.
- New tests added in this phase (instanceHelpers) must pass; they do.
