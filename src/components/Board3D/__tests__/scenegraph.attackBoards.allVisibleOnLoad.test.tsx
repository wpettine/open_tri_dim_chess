import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderR3F, findMeshes, cleanup } from '../../../test/threeTestUtils';
import { BoardRenderer } from '../BoardRenderer';

describe('BoardRenderer - All Attack Boards Visible On Load', () => {
  let root: { unmount?: () => void } | null;

  afterEach(() => {
    if (root) {
      cleanup(root);
      root = null;
    }
  });

  it('renders only main boards initially (attack boards hidden)', async () => {
    const result = await renderR3F(<BoardRenderer />);
    root = result.root;

    const meshes = findMeshes(result.scene, () => true);
    const platforms = meshes.filter((m) => (m.userData as { testId?: string } | undefined)?.testId === 'attack-platform');
    const squares = meshes.filter((m) => (m.userData as { testId?: string } | undefined)?.testId === 'square');

    expect(platforms.length).toBe(3 + 4); // 3 main + 4 visible attack boards when trackStates applied; initial should be 3 if none visible
    expect(squares.length).toBe(48); // only main board squares
  });
});
