import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderR3F, findMeshes, cleanup } from '../../../test/threeTestUtils';
import { BoardRenderer } from '../BoardRenderer';

describe('BoardRenderer - All Attack Boards Visible On Load', () => {
  let root: any;

  afterEach(() => {
    if (root) {
      cleanup(root);
      root = null;
    }
  });

  it('renders squares for every attack-board instance on initial load', async () => {
    const result = await renderR3F(<BoardRenderer />);
    root = result.root;

    const meshes = findMeshes(result.scene, () => true);
    const platforms = meshes.filter((m: any) => m.userData?.testId === 'attack-platform');
    const squares = meshes.filter((m: any) => m.userData?.testId === 'square');

    expect(platforms.length).toBe(27);
    expect(squares.length).toBe(144);
  });
});
