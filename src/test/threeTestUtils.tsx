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
) {
  if (options?.storeState) {
    const original = useGameStore.getState();
    useGameStore.setState({ ...original, ...options.storeState }, true);
  }
  
  const root = await create(ui);
  const scene = root.scene;
  
  return { root, scene };
}

/**
 * Recursively finds all mesh objects in a Three.js scene that match a predicate.
 * 
 * @param node - The Three.js object to start searching from
 * @param predicate - Function that returns true for meshes to include
 * @param out - Accumulator array for results (internal use)
 * @returns Array of matching mesh objects
 */
export function findMeshes(
  node: any, 
  predicate: (obj: any) => boolean, 
  out: any[] = []
): any[] {
  if (!node) return out;
  
  const threeObj = node.__fiber?.stateNode || node.instance;
  if (threeObj?.type === 'Mesh' && predicate(threeObj)) {
    out.push(threeObj);
  }
  
  if (threeObj?.children) {
    threeObj.children.forEach((child: any) => findMeshes(child, predicate, out));
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
  node: any,
  key: string,
  value?: any
): any[] {
  const results: any[] = [];
  
  function traverse(obj: any) {
    if (!obj) return;
    
    if (obj.userData && key in obj.userData) {
      if (value === undefined || obj.userData[key] === value) {
        results.push(obj);
      }
    }
    
    if (obj.children) {
      obj.children.forEach((child: any) => traverse(child));
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
export function cleanup(root: any) {
  if (root) {
    root.unmount();
  }
  useGameStore.getState().resetGame();
}
