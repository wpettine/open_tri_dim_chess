# Rendering Test Plan

Audience
- This document is designed so another Devin session (or any contributor) can implement rendering tests without prior context.

Status
- No existing rendering/visual tests are present. Current tests are logic-only under src/engine/world/__tests__.
- Vitest is configured with jsdom and setup file. No Playwright or @react-three/test-renderer deps yet.

Objectives
- Verify that 3D rendering matches engine/world logic:
  - Scene graph integrity: transforms and visibility equal world.squares and TrackState.
  - Pixel correctness: rendered canvas matches expected pixels for key scenarios.
- Keep tests deterministic, CI-friendly, and fast where possible.

Strategy Overview
- Tier 1 (fast): Scene-graph assertions using @react-three/test-renderer within Vitest/jsdom.
- Tier 2 (pixel): Pixel-level visual regression using Playwright + pixelmatch, with strict determinism.

Prerequisites
- Node >= 20.19.0 (project requirement)
- npm

Dependencies To Add
- Tier 1:
  - @react-three/test-renderer
- Tier 2:
  - @playwright/test
  - pixelmatch
  - pngjs

Add to package.json (devDependencies):
- "@react-three/test-renderer": "^x.y.z"
- "@playwright/test": "^x.y.z"
- "pixelmatch": "^x.y.z"
- "pngjs": "^x.y.z"

Add scripts:
- "test:visual": "playwright test"
- Optional: "test:visual:update": "PLAYWRIGHT_UPDATE_SNAPSHOTS=1 playwright test"

Project Files to Create

A) Scene-graph utilities (Tier 1)
- src/test/threeTestUtils.tsx
  - Purpose: Render React Three Fiber scenes without DOM canvas and expose the Three.js scene for assertions.
  - Contents:
    - renderR3F(ui, { storeState? }): mounts a <group>{ui}</group> with a mocked Zustand store and returns { root, scene } from @react-three/test-renderer.
    - findMeshes(scene, predicate): DFS helper to collect meshes by type/name/userData.
    - closeTo(a, b, eps = 1e-5) numeric comparer.

- src/test/storeFixtures.ts
  - Purpose: Deterministic game state fixtures for rendering.
  - Contents:
    - buildWorldWithDefaults(): small world with known boards/squares and default track states.
    - buildPiecesMinimal(): 2–4 pieces with fixed file/rank/level for easy assertion.
    - buildStoreState({ world?, pieces?, selectedBoardId?, highlightedSquareIds?, trackStates? }).

B) Scene-graph tests (Tier 1)
- src/components/Board3D/__tests__/scenegraph.boardSquares.test.ts
  - Asserts: For each square mesh, mesh.position equals square.worldX/Y/Z.
  - Steps:
    1) Create storeState with world (squares populated).
    2) renderR3F(<BoardRenderer />, { storeState }).
    3) Traverse scene; collect square meshes by geometry/type.
    4) Map back to square ids; assert positions.

- src/components/Board3D/__tests__/scenegraph.pieces.test.ts
  - Asserts: Each piece mesh sits at its world square with +0.5 Z offset (per Pieces3D).
  - Steps:
    1) Store with minimal pieces and world.
    2) renderR3F(<Pieces3D />, { storeState }).
    3) Find piece meshes by geometry or userData.
    4) Assert positions against computed square.worldX/Y/(Z+0.5).

- src/components/Board3D/__tests__/scenegraph.visibility.test.ts
  - Asserts: Only visible boards render; attack-board selector disks appear only for attack boards; main-board pin eligibility markers reflect canMoveBoard(true) pins.
  - Steps:
    1) Build storeState with a specific TrackState.
    2) renderR3F(<BoardRenderer />, { storeState }).
    3) Assert count of visible boards == expected (four attack-board instances).
    4) Assert selector disk meshes exist for visible attack boards only.
    5) If selectedBoardId is set, pin markers on main boards reflect eligibility color for canMoveBoard hits.

C) Pixel tests (Tier 2)
- playwright.config.ts
  - Base config with:
    - Use Chromium only (fastest, most consistent).
    - viewport: { width: 1280, height: 720 }
    - deviceScaleFactor: 1 (deterministic)
    - testDir: "tests/visual"
    - retries: 0 (start with none)
    - fullyParallel: false
  - Optional: webServer if using Vite preview; or tests can mount a minimal static test page directly.

- tests/visual/board.initial.spec.ts
  - Snapshot the canvas rendering Board3D with a deterministic store state.
  - Steps:
    1) Navigate to a minimal page that renders <Board3D /> with injected store.
    2) Ensure GSAP animations disabled (duration=0) or wait for a settle function that resolves after controls/camera updated.
    3) Screenshot canvas only via locator('canvas').
    4) Compare with golden via pixelmatch; fail on delta > threshold (e.g., 0.01–0.05 depending on AA/noise).

- tests/visual/board.visibility.spec.ts
  - Change TrackState to another valid configuration; assert pixels reflect only four visible instances at new pins.

- tests/visual/board.arrivalMapping.spec.ts
  - Prepare scenes for identity vs rot180 arrival mapping; verify pixel differences reflect rotation mapping (orientations and piece positions).

Implementation Details

1) Tier 1: Using @react-three/test-renderer
- Example code sketch for threeTestUtils.tsx:

  import { create } from '@react-three/test-renderer';
  import { ReactNode } from 'react';
  import { useGameStore } from '../store/gameStore';

  export async function renderR3F(ui: ReactNode, { storeState }: { storeState: Partial<ReturnType<typeof useGameStore.getState>> }) {
    const original = useGameStore.getState();
    useGameStore.setState({ ...original, ...storeState }, true);
    const root = await create(ui);
    const scene = root.scene;
    return { root, scene };
  }

  export function findMeshes(node: any, predicate: (obj: any) => boolean, out: any[] = []) {
    if (!node) return out;
    if (node.type === 'Mesh' && predicate(node)) out.push(node);
    if (node.children) node.children.forEach((c: any) => findMeshes(c, predicate, out));
    return out;
  }

- Scene traversal: Identify squares by geometry size (THEME.squares.size) or by attaching userData on render (low-risk enhancement if needed).

2) Tier 2: Playwright + pixelmatch
- Two options to render:
  a) Run the Vite dev server or preview and visit / (simplest).
  b) Create a small standalone test page that imports Board3D and mounts it with a deterministic store (more isolation).

- Suggested simplest start:
  - Use vite preview via npm run preview in CI's Playwright "webServer" hook.
  - Ensure deterministic camera:
    - Option 1: Add a TEST_MODE env that sets GSAP duration=0 in CameraController.
    - Option 2: In tests, wait for a settle function exposed globally via window.__ready = promise that resolves when camera and controls updated.

- Pixel comparison utility (tests/visual/utils/compare.ts):
  - Load baseline and actual with pngjs.
  - Use pixelmatch(actual, baseline, diff, width, height, { threshold: 0.05 }).
  - Write diff image when failing for debugging.

Determinism Guidelines
- Camera:
  - Prefer static camera preset; set GSAP durations to 0 in tests or wait for explicit signal.
- Lighting/Materials:
  - Keep THEME constants fixed; avoid randomization.
- Rendering:
  - viewport: 1280x720; deviceScaleFactor: 1.
  - Prefer WebGL deterministic features; do not rely on time-based shaders.
- Timing:
  - Wait for 2× requestAnimationFrame after any state change before snapshot.

Proposed File Layout (full)
- src/test/
  - threeTestUtils.tsx
  - storeFixtures.ts
- src/components/Board3D/__tests__/
  - scenegraph.boardSquares.test.ts
  - scenegraph.pieces.test.ts
  - scenegraph.visibility.test.ts
- tests/visual/
  - utils/compare.ts
  - board.initial.spec.ts
  - board.visibility.spec.ts
  - board.arrivalMapping.spec.ts
  - golden/ (commit baselines)

Example Test Skeletons

// scenegraph.boardSquares.test.ts
import { renderR3F, findMeshes } from '../../../test/threeTestUtils';
import { BoardRenderer } from '../BoardRenderer';
import { buildStoreState } from '../../../test/storeFixtures';

test('square meshes align to world squares', async () => {
  const storeState = buildStoreState(/* defaults */);
  const { scene } = await renderR3F(<BoardRenderer />, { storeState });
  const squares = findMeshes(scene, m => m.geometry?.parameters?.width === THEME.squares.size);
  // Map meshes back to world squares (e.g., via position lookup table); assert positions
});

// scenegraph.pieces.test.ts
import { Pieces3D } from '../Pieces3D';
test('piece meshes align to their world squares (+0.5 z)', async () => {
  // similar pattern as above
});

// board.initial.spec.ts (Playwright)
import { test, expect } from '@playwright/test';
import { compareWithGolden } from './utils/compare';

test('initial board pixels match golden', async ({ page }) => {
  await page.goto('http://localhost:4173'); // vite preview
  await page.waitForFunction('window.__ready === true'); // ensure settled
  const buffer = await page.locator('canvas').screenshot();
  await compareWithGolden(buffer, 'golden/board.initial.png', { threshold: 0.03 });
});

CI Integration
- Add a separate job/workflow step for Playwright:
  - Install: npm ci
  - Build: npm run build
  - Preview: npm run preview (used by Playwright config via webServer)
  - Run Vitest: npm test
  - Run Playwright: npm run test:visual
- Cache .cache/Playwright and node_modules to speed up.
- Golden images:
  - Commit under tests/visual/golden/.
  - When intentional visuals change, update by regenerating locally with PLAYWRIGHT_UPDATE_SNAPSHOTS=1, inspect diffs, commit.

Maintenance Tips
- Favor Tier 1 tests for broad coverage (fast, stable).
- Use Tier 2 only for high-value visuals (initial scene, visibility transitions, arrival mapping).
- When flakiness appears:
  - Check viewport/deviceScaleFactor.
  - Ensure GSAP/camera settle.
  - Reduce AA or fix to a known state.

Mapping to Current Components
- BoardRenderer:
  - Squares positioned at square.worldX/Y/Z; selector disks for attack boards; pin markers for eligible pins.
- Pieces3D:
  - Mesh at [square.worldX, square.worldY, square.worldZ + 0.5].
- Visibility:
  - Exactly four attack-board instances visible after updateInstanceVisibility; tests should assert only these render.

Appendix: Execution Checklist
- Install deps.
- Add scene-graph helpers and fixtures.
- Implement three scene-graph tests.
- Add Playwright config and one baseline pixel test.
- Add CI steps and commit golden images.
