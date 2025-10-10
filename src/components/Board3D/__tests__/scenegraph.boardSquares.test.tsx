import { describe, it, expect, afterEach } from 'vitest';
import { renderR3F, findMeshes, closeTo, cleanup } from '../../../test/threeTestUtils';
import { buildStoreState, buildWorldWithDefaults } from '../../../test/storeFixtures';
import { BoardRenderer } from '../BoardRenderer';
import { THEME } from '../../../config/theme';

describe('BoardRenderer - Square Mesh Positioning', () => {
  let root: { unmount?: () => void } | null;

  afterEach(() => {
    if (root) {
      cleanup(root);
      root = null;
    }
  });

  it('should position all square meshes at their WorldSquare coordinates', async () => {
    const world = buildWorldWithDefaults();
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
          geo.parameters?.height === THEME.squares.size &&
          geo.parameters?.depth === 0.1 // Square depth from BoardRenderer
        );
      }
    );

    expect(squareMeshes.length).toBeGreaterThan(0);

    const worldSquares = Array.from(world.squares.values());
    
    for (const mesh of squareMeshes) {
      const meshPos = mesh.position;
      
      const matchingSquare = worldSquares.find((sq) =>
        closeTo(sq.worldX, meshPos.x) &&
        closeTo(sq.worldY, meshPos.y) &&
        closeTo(sq.worldZ, meshPos.z)
      );

      expect(matchingSquare).toBeDefined();
      
      if (matchingSquare) {
        expect(closeTo(mesh.position.x, matchingSquare.worldX)).toBe(true);
        expect(closeTo(mesh.position.y, matchingSquare.worldY)).toBe(true);
        expect(closeTo(mesh.position.z, matchingSquare.worldZ)).toBe(true);
      }
    }
  });

  it('should render correct number of squares for main boards only', async () => {
    const world = buildWorldWithDefaults();
    
    world.boards.forEach((board) => {
      if (board.type === 'attack') {
        board.isVisible = false;
      }
    });

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

    expect(squareMeshes.length).toBe(48);
  });

  it('should position main board squares correctly', async () => {
    const world = buildWorldWithDefaults();
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const whiteMainSquare = Array.from(world.squares.values()).find(
      (sq) => sq.file === 1 && sq.rank === 2 && sq.boardId === 'WL'
    );
    expect(whiteMainSquare).toBeDefined();

    if (whiteMainSquare) {
      const squareMeshes = findMeshes(
        scene,
        (mesh) => {
          return (
            mesh.geometry?.type === 'BoxGeometry' &&
            closeTo(mesh.position.x, whiteMainSquare.worldX) &&
            closeTo(mesh.position.y, whiteMainSquare.worldY) &&
            closeTo(mesh.position.z, whiteMainSquare.worldZ)
          );
        }
      );

      expect(squareMeshes.length).toBeGreaterThan(0);
      
      const mesh = squareMeshes[0];
      expect(closeTo(mesh.position.x, whiteMainSquare.worldX)).toBe(true);
      expect(closeTo(mesh.position.y, whiteMainSquare.worldY)).toBe(true);
      expect(closeTo(mesh.position.z, whiteMainSquare.worldZ)).toBe(true);
    }
  });

  it('should not calculate positions - must read from WorldSquare', async () => {
    const world = buildWorldWithDefaults();
    const storeState = buildStoreState({ world });

    const result = await renderR3F(<BoardRenderer />, { storeState });
    root = result.root;
    const scene = result.scene;

    const squareMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return geo?.type === 'BoxGeometry' && geo.parameters?.depth === 0.1;
      }
    );

    const worldSquares = Array.from(world.squares.values());
    
    for (const mesh of squareMeshes) {
      const matchingSquare = worldSquares.find((sq) =>
        closeTo(sq.worldX, mesh.position.x) &&
        closeTo(sq.worldY, mesh.position.y) &&
        closeTo(sq.worldZ, mesh.position.z)
      );

      expect(matchingSquare).toBeDefined();
    }
  });
});
