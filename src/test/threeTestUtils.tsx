import { create } from '@react-three/test-renderer';
import { ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState } from '../store/gameStore';

/**
 * Renders a React Three Fiber component with a mocked game store state.
 * Uses @react-three/test-renderer to create a scene without needing a DOM canvas.
 * 
 * @param ui - The React Three Fiber component to render
 * @param options - Configuration options including storeState to inject
 * @returns Object with root (test renderer) and scene (Three.js scene)
 */
export async function renderR3F(
  ui: ReactNode, 
  options?: { storeState?: Partial<GameState> }
): Promise<{ root: { unmount: () => void }; scene: unknown }> {
  if (options?.storeState) {
    const original = useGameStore.getState();
    useGameStore.setState({ ...original, ...options.storeState }, true);
  }
  
  const root = await create(ui);

  let scene: unknown = (root as unknown as { scene?: unknown })?.scene;
  for (let i = 0; i < 10 && !scene; i++) {
    await new Promise((r) => setTimeout(r, 0));
    scene = (root as unknown as { scene?: unknown })?.scene;
  }
  if (!scene) {
    scene = root as unknown;
  }

  return { root: root as unknown as { unmount: () => void }, scene };
}

/**
 * Recursively finds all mesh objects in a Three.js scene that match a predicate.
 * 
 * @param node - The Three.js object to start searching from
 * @param predicate - Function that returns true for meshes to include
 * @param out - Accumulator array for results (internal use)
 * @returns Array of matching mesh objects
 */
export type MeshInfo = {
  type?: string;
  geometry?: unknown;
  userData?: Record<string, unknown>;
  position?: unknown;
  children?: unknown[];
};

type FiberLike = {
  instance?: unknown;
  _fiber?: { object?: unknown; stateNode?: unknown };
  __fiber?: { stateNode?: unknown };
  children?: unknown[];
  type?: string;
  userData?: Record<string, unknown>;
  geometry?: unknown;
  position?: unknown;
};

export function findMeshes(
  node: unknown, 
  predicate: (obj: MeshInfo) => boolean, 
  out: MeshInfo[] = []
): MeshInfo[] {
  if (!node) return out;
  const n = node as FiberLike;
  const start: FiberLike =
    (n.instance as unknown as FiberLike) ??
    (n._fiber?.object as unknown as FiberLike) ??
    (n._fiber?.stateNode as unknown as FiberLike) ??
    (n.__fiber?.stateNode as unknown as FiberLike) ??
    (n as FiberLike);

  if ((start?.type) === 'Mesh' && predicate(start as MeshInfo)) {
    out.push(start as MeshInfo);
  }
  
  const children = Array.isArray(start?.children) ? start.children! : [];
  for (const child of children) {
    findMeshes(child, predicate, out);
  }
  
  return out;
}

/**
 * Checks if two numbers are approximately equal within a tolerance.
 * 
 * @param a - First number
 * @param b - Second number
 * @param epsilon - Maximum allowed difference (default: 1e-5)
 * @returns True if numbers are within epsilon of each other
 */
export function closeTo(a: number, b: number, epsilon = 1e-5): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Finds all objects in a scene by their userData property.
 * 
 * @param node - The Three.js object to start searching from
 * @param key - The userData key to search for
 * @param value - Optional value to match (if undefined, just checks for key existence)
 * @returns Array of matching objects
 */
export function findByUserData(
  node: unknown,
  key: string,
  value?: unknown
) {
  const results: unknown[] = [];
  
  function traverse(obj: unknown) {
    if (!obj) return;

    const o = obj as { instance?: unknown; _fiber?: { object?: unknown; stateNode?: unknown }; __fiber?: { stateNode?: unknown }; userData?: Record<string, unknown>; children?: unknown[] };
    const start =
      o?.instance ??
      o?._fiber?.object ??
      o?.__fiber?.stateNode ??
      o;
    
    const s = start as { userData?: Record<string, unknown>; children?: unknown[] };
    if (s?.userData && key in s.userData) {
      if (value === undefined || s.userData[key] === value) {
        results.push(start);
      }
    }
    
    if (Array.isArray(s?.children)) {
      s.children.forEach((child: unknown) => traverse(child));
    }
  }
  
  traverse(node);
  return results;
}

/**
 * Cleans up test renderer and resets game store to initial state.
 * 
 * @param root - The test renderer root to clean up
 */
export function cleanup(root: { unmount?: () => void } | null) {
  if (root?.unmount) {
    root.unmount();
  }
  useGameStore.getState().resetGame();
}
