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
    const squares = meshes.filter((m) => (m.userData as { testId?: string } | undefined)?.testId === 'square');

    expect(squares.length).toBe(64); // main board squares + four attack instances (16 squares)
  });
});
