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

  it('renders main boards and 4 active attack board instances on initial load', async () => {
    const result = await renderR3F(<BoardRenderer />);
    root = result.root;

    const meshes = findMeshes(result.scene, () => true);
    const squares = meshes.filter((m) => (m.userData as { testId?: string } | undefined)?.testId === 'square');

    expect(squares.length).toBe(64); // 48 main board squares + 16 attack board squares (4 active instances × 4 squares each)
  });
});
