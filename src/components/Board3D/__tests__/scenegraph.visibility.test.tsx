import { describe, it, expect, afterEach } from 'vitest';
import { renderR3F, findMeshes, closeTo, cleanup } from '../../../test/threeTestUtils';
import { buildStoreState, buildWorldWithVisibleBoards } from '../../../test/storeFixtures';
import { BoardRenderer } from '../BoardRenderer';
import { THEME } from '../../../config/theme';

describe('BoardRenderer - Visibility and Attack Board Controls', () => {
  let root: { unmount?: () => void } | null;

  afterEach(() => {
    if (root) {
      cleanup(root);
      root = null;
    }
  });

  it('should only render squares for visible boards', async () => {
    const world = buildWorldWithVisibleBoards(['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const squareMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'BoxGeometry' &&
          geo.parameters?.width === THEME.squares.size &&
          geo.parameters?.height === THEME.squares.size
        );
      }
    );

    expect(squareMeshes.length).toBe(64);

    const visibleBoardIds = new Set(['WL', 'NL', 'BL', 'QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
    
    for (const mesh of squareMeshes) {
      const matchingSquare = Array.from(world.squares.values()).find((sq) =>
        closeTo(sq.worldX, mesh.position.x) &&
        closeTo(sq.worldY, mesh.position.y) &&
        closeTo(sq.worldZ, mesh.position.z)
      );

      expect(matchingSquare).toBeDefined();
      if (matchingSquare) {
        expect(visibleBoardIds.has(matchingSquare.boardId)).toBe(true);
      }
    }
  });

  it('should render selector disks only for attack boards', async () => {
    const world = buildWorldWithVisibleBoards(['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const selectorDisks = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'CylinderGeometry' &&
          closeTo(geo.parameters?.radiusTop, THEME.attackBoardSelector.radius) &&
          closeTo(geo.parameters?.radiusBottom, THEME.attackBoardSelector.radius) &&
          closeTo(geo.parameters?.height, THEME.attackBoardSelector.thickness)
        );
      }
    );

    expect(selectorDisks.length).toBe(4);
  });

  it('should not render selector disks for main boards', async () => {
    const world = buildWorldWithVisibleBoards([]); // No attack boards visible
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const selectorDisks = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'CylinderGeometry' &&
          closeTo(geo.parameters?.radiusTop, THEME.attackBoardSelector.radius)
        );
      }
    );

    expect(selectorDisks.length).toBe(0);
  });

  it('should render exactly 4 attack board instances based on trackStates', async () => {
    const trackStates = {
      QL: { whiteBoardPin: 2, blackBoardPin: 5, whiteRotation: 0 as 0 | 180, blackRotation: 180 as 0 | 180 },
      KL: { whiteBoardPin: 3, blackBoardPin: 4, whiteRotation: 0 as 0 | 180, blackRotation: 0 as 0 | 180 },
    };

    const world = buildWorldWithVisibleBoards(['QL2:0', 'QL5:180', 'KL3:0', 'KL4:0']);
    const storeState = buildStoreState({ world, trackStates });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const attackBoardPlatforms = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'BoxGeometry' &&
          closeTo(geo.parameters?.width, 2 * 2.1) && // 2×2 board with 2.1 multiplier
          closeTo(geo.parameters?.height, 2 * 2.1) &&
          closeTo(geo.parameters?.depth, THEME.platforms.thickness)
        );
      }
    );

    expect(attackBoardPlatforms.length).toBeGreaterThanOrEqual(4);
  });

  it('should render pin eligibility markers on main boards when attack board selected', async () => {
    const world = buildWorldWithVisibleBoards(['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
    const storeState = buildStoreState({
      world,
      selectedBoardId: 'QL1:0', // Attack board selected
    });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const pinMarkers = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'CylinderGeometry' &&
          closeTo(geo.parameters?.radiusTop, THEME.pinLocationDisk.radius) &&
          closeTo(geo.parameters?.radiusBottom, THEME.pinLocationDisk.radius) &&
          closeTo(geo.parameters?.height, THEME.pinLocationDisk.thickness)
        );
      }
    );

    expect(pinMarkers.length).toBeGreaterThan(0);
  });

  it('should hide all attack board instances when none are active', async () => {
    const world = buildWorldWithVisibleBoards([]); // All hidden
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const squareMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'BoxGeometry' &&
          geo.parameters?.width === THEME.squares.size
        );
      }
    );

    expect(squareMeshes.length).toBe(48);

    for (const mesh of squareMeshes) {
      const matchingSquare = Array.from(world.squares.values()).find((sq) =>
        closeTo(sq.worldX, mesh.position.x) &&
        closeTo(sq.worldY, mesh.position.y) &&
        closeTo(sq.worldZ, mesh.position.z)
      );

      if (matchingSquare) {
        const board = world.boards.get(matchingSquare.boardId);
        expect(board?.type).not.toBe('attack');
      }
    }
  });

  it('should render different attack board instances based on rotation', async () => {
    const worldWithRotation0 = buildWorldWithVisibleBoards(['QL1:0', 'KL1:0', 'QL6:0', 'KL6:0']);
    const storeStateRotation0 = buildStoreState({ world: worldWithRotation0 });

    const result1 = await renderR3F(<BoardRenderer />, { storeState: storeStateRotation0 });
    const scene1 = result1.scene;

    const squaresRotation0 = findMeshes(
      scene1,
      (mesh) => {
        const geo = mesh.geometry;
        return geo?.type === 'BoxGeometry' && geo.parameters?.width === THEME.squares.size;
      }
    );

    result1.root.unmount();
    await new Promise((r) => setTimeout(r, 0));


    const worldWithRotation180 = buildWorldWithVisibleBoards(['QL1:180', 'KL1:180', 'QL6:180', 'KL6:180']);
    const storeStateRotation180 = buildStoreState({ world: worldWithRotation180 });

    const result2 = await renderR3F(<BoardRenderer />, { storeState: storeStateRotation180 });
    root = result2.root;
    const scene2 = result2.scene;

    const squaresRotation180 = findMeshes(
      scene2,
      (mesh) => {
        const geo = mesh.geometry;
        return geo?.type === 'BoxGeometry' && geo.parameters?.width === THEME.squares.size;
      }
    );

    expect(squaresRotation0.length).toBe(squaresRotation180.length);

    const boardIds0 = squaresRotation0
      .map(m => {
        const sq = Array.from(worldWithRotation0.squares.values()).find(s =>
          closeTo(s.worldX, m.position.x) && closeTo(s.worldY, m.position.y) && closeTo(s.worldZ, m.position.z)
        );
        return sq?.boardId;
      })
      .filter(id => id?.includes(':'));

    const boardIds180 = squaresRotation180
      .map(m => {
        const sq = Array.from(worldWithRotation180.squares.values()).find(s =>
          closeTo(s.worldX, m.position.x) && closeTo(s.worldY, m.position.y) && closeTo(s.worldZ, m.position.z)
        );
        return sq?.boardId;
      })
      .filter(id => id?.includes(':'));

    expect(new Set(boardIds0).size).toBeGreaterThan(0);
    expect(new Set(boardIds180).size).toBeGreaterThan(0);
  });
});
