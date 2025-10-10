import { describe, it, expect, afterEach } from 'vitest';
import { renderR3F, findMeshes, closeTo, cleanup } from '../../../test/threeTestUtils';
import { buildStoreState, buildPiecesMinimal, createTestPiece } from '../../../test/storeFixtures';
import { Pieces3D } from '../Pieces3D';
import { resolveBoardId } from '../../../utils/resolveBoardId';


describe('Pieces3D - Piece Mesh Positioning', () => {
  let root: { unmount?: () => void } | null;

  afterEach(() => {
    if (root) {
      cleanup(root);
      root = null;
    }
  });

  it('should position piece meshes at square worldX/Y/Z + 0.5 offset', async () => {
    const pieces = buildPiecesMinimal();
    const storeState = buildStoreState({ pieces });

    const result = await renderR3F(<Pieces3D />, { storeState });
    root = result.root;
    const scene = result.scene;

    const pieceMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'ConeGeometry' ||
          geo?.type === 'BoxGeometry' ||
          geo?.type === 'CylinderGeometry' ||
          geo?.type === 'OctahedronGeometry'
        );
      }
    );


    expect(pieceMeshes.length).toBe(pieces.length);

    const world = storeState.world!;

    for (const piece of pieces) {
      const boardId = resolveBoardId(piece.level);
      const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${boardId}`;
      const square = world.squares.get(squareId);

      expect(square).toBeDefined();

      if (square) {
        const pieceMesh = pieceMeshes.find((mesh) =>
          closeTo(mesh.position.x, square.worldX) &&
          closeTo(mesh.position.y, square.worldY) &&
          closeTo(mesh.position.z, square.worldZ + 0.5) // +0.5 Z offset
        );

        expect(pieceMesh).toBeDefined();

        if (pieceMesh) {
          expect(closeTo(pieceMesh.position.x, square.worldX)).toBe(true);
          expect(closeTo(pieceMesh.position.y, square.worldY)).toBe(true);
          expect(closeTo(pieceMesh.position.z, square.worldZ + 0.5)).toBe(true);
        }
      }
    }
  });

  it('should render correct geometry for each piece type', async () => {
    const pieces = [
      createTestPiece('pawn', 'white', 1, 2, 'W'),
      createTestPiece('rook', 'white', 1, 1, 'W'),
      createTestPiece('knight', 'white', 2, 1, 'W'),
      createTestPiece('bishop', 'white', 3, 1, 'W'),
      createTestPiece('queen', 'white', 2, 3, 'N'),
      createTestPiece('king', 'white', 4, 0, 'WKL'),
    ];

    const storeState = buildStoreState({ pieces });

    const result = await renderR3F(<Pieces3D />, { storeState });
    root = result.root;
    const scene = result.scene;

    const coneMeshes = findMeshes(scene, (mesh) => mesh.geometry?.type === 'ConeGeometry');
    const boxMeshes = findMeshes(scene, (mesh) => mesh.geometry?.type === 'BoxGeometry');
    const cylinderMeshes = findMeshes(scene, (mesh) => mesh.geometry?.type === 'CylinderGeometry');
    const octahedronMeshes = findMeshes(scene, (mesh) => mesh.geometry?.type === 'OctahedronGeometry');

    expect(coneMeshes.length).toBe(2);

    expect(boxMeshes.length).toBe(2);

    expect(cylinderMeshes.length).toBe(1);

    expect(octahedronMeshes.length).toBe(1);
  });

  it('should use square lookup instead of calculating positions', async () => {
    const pieces = buildPiecesMinimal();
    const storeState = buildStoreState({ pieces });

    const result = await renderR3F(<Pieces3D />, { storeState });
    root = result.root;
    const scene = result.scene;

    const pieceMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'ConeGeometry' ||
          geo?.type === 'BoxGeometry' ||
          geo?.type === 'CylinderGeometry' ||
          geo?.type === 'OctahedronGeometry'
        );
      }
    );


    const world = storeState.world!;

    for (const mesh of pieceMeshes) {
      const matchingSquare = Array.from(world.squares.values()).find((sq) =>
        closeTo(sq.worldX, mesh.position.x) &&
        closeTo(sq.worldY, mesh.position.y) &&
        closeTo(sq.worldZ + 0.5, mesh.position.z)
      );

      expect(matchingSquare).toBeDefined();
    }
  });

  it('should handle pieces on attack boards', async () => {
    const pieces = [
      createTestPiece('king', 'white', 4, 0, 'WKL'),
      createTestPiece('pawn', 'white', 1, 1, 'WQL'),
    ];

    const storeState = buildStoreState({ pieces });

    const result = await renderR3F(<Pieces3D />, { storeState });
    root = result.root;
    const scene = result.scene;

    const pieceMeshes = findMeshes(
      scene,
      (mesh) => {
        const geo = mesh.geometry;
        return (
          geo?.type === 'ConeGeometry' ||
          geo?.type === 'BoxGeometry' ||
          geo?.type === 'CylinderGeometry' ||
          geo?.type === 'OctahedronGeometry'
        );
      }
    );


    expect(pieceMeshes.length).toBe(2);

    const world = storeState.world!;

    for (const piece of pieces) {
      const boardId = resolveBoardId(piece.level);
      const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${boardId}`;
      const square = world.squares.get(squareId);

      expect(square).toBeDefined();

      if (square) {
        const pieceMesh = pieceMeshes.find((mesh) =>
          closeTo(mesh.position.x, square.worldX) &&
          closeTo(mesh.position.y, square.worldY) &&
          closeTo(mesh.position.z, square.worldZ + 0.5)
        );

        expect(pieceMesh).toBeDefined();
      }
    }
  });
});
