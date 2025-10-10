# Rendering Test Debugger - Test Renderer Issue

## Bug Summary

**Issue**: Tests fail with `TypeError: Cannot read properties of undefined (reading 'type')` when using `@react-three/test-renderer` to test 3D rendering components.

**Root Cause**: The test renderer returns `ReactThreeTestInstance` wrapper objects that require special handling to access the underlying Three.js objects. The original implementation attempted to access properties like `.type` and `.children` directly on the wrapper, which triggered getters that fail when internal fiber structures are incomplete.

**Status**: Partial fix implemented - prevents crashes but tests still find 0 meshes (13 tests still failing).

---

## Original Implementation

The original `findMeshes()` function in `src/test/threeTestUtils.tsx` directly accessed properties on the node:

```typescript
export function findMeshes(node: any, predicate: (obj: any) => boolean, out: any[] = []): any[] {
  if (!node) return out;
  
  if (node.type === 'Mesh' && predicate(node)) {  // ❌ Triggers getter on wrapper
    out.push(node);
  }
  
  if (node.children) {  // ❌ Triggers children getter which fails
    node.children.forEach((child: any) => findMeshes(child, predicate, out));
  }
  
  return out;
}
```

**Error Stack Trace**:
```
TypeError: Cannot read properties of undefined (reading 'type')
 ❯ ReactThreeTestInstance.get type [as type] 
   node_modules/@react-three/test-renderer/.../react-three-test-renderer.cjs.dev.js:773:31
```

---

## Attempted Fix (From PR Description)

The PR description suggested:

```typescript
const threeObj = node.__fiber?.stateNode || node.instance;
if (threeObj?.type === 'Mesh' && predicate(threeObj)) {
  out.push(threeObj);
}
```

**Implementation**:
```typescript
export function findMeshes(node: any, predicate: (obj: any) => boolean, out: any[] = []): any[] {
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
```

**Result**: Tests no longer crash, but find 0 meshes.

---

## Investigation Findings

### ReactThreeTestInstance Structure

From `@react-three/test-renderer` type definitions:

```typescript
class ReactThreeTestInstance<TObject extends THREE.Object3D = THREE.Object3D> {
  _fiber: Instance<TObject>;
  
  get instance(): TObject;           // Returns this._fiber.object
  get type(): string;                // Returns this._fiber.object.type
  get children(): ReactThreeTestInstance[];
  
  findAll(decider: (node: ReactThreeTestInstance) => boolean): ReactThreeTestInstance[];
  // ... other methods
}
```

### Key Discoveries

1. **`node.__fiber` doesn't exist** - Only `node._fiber` exists (single underscore)
2. **`node.instance` returns `undefined`** - Because `_fiber.object` is `undefined` for the root scene wrapper
3. **`node.children` triggers failing getter** - Accessing `.children` calls `getChildren()` which tries to access `fiber.children.filter()`, failing when `fiber.children` is `undefined`
4. **Root scene fiber structure is incomplete** - The scene's `_fiber` (which IS the `__r3f` object) doesn't have an `object` property pointing back to the Three.js scene

### Test Renderer Scene Setup

From the test renderer source:
```javascript
const _scene = _store.getState().scene.__r3f;  // Get R3F fiber from scene
return {
  scene: wrapFiber(_scene),  // Wrap fiber in ReactThreeTestInstance
  // ...
}
```

The scene returned is a `ReactThreeTestInstance` wrapping the R3F fiber (`__r3f`), not the actual Three.js scene object.

---

## Approaches Attempted

### 1. Direct Property Access (Original - Failed)
```typescript
const threeObj = node;
if (threeObj?.type === 'Mesh' && predicate(threeObj)) { ... }
```
**Result**: Crashes with "Cannot read properties of undefined (reading 'type')"

### 2. Use node.instance (PR Fix - Partial Success)
```typescript
const threeObj = node.__fiber?.stateNode || node.instance;
```
**Result**: No crash, but `threeObj` is `undefined`, finds 0 meshes

### 3. Fallback to node
```typescript
const threeObj = node.__fiber?.stateNode || node.instance || node;
```
**Result**: 16 failed tests - accessing `.type` on wrapper triggers same error

### 4. Use _fiber.object directly
```typescript
const threeObj = node._fiber?.object || node.instance;
```
**Result**: 13 failed tests - `_fiber.object` is `undefined` for root

### 5. Traverse fiber children
```typescript
if (!threeObj && node._fiber?.children) {
  node._fiber.children.forEach((childFiber: any) => {
    findMeshes({ _fiber: childFiber }, predicate, out);
  });
}
```
**Result**: 13 failed tests - `_fiber.children` is `undefined`

### 6. Use ReactThreeTestInstance.findAll()
```typescript
if (node.findAll && typeof node.findAll === 'function') {
  const allInstances = node.findAll(() => true);
  allInstances.forEach((instance: any) => { ... });
}
```
**Result**: 16 failed tests - `findAll()` internally uses `allChildren` which triggers same error

### 7. Access scene from fiber.root
```typescript
else if (!threeObj && node._fiber?.root) {
  const scene = node._fiber.root.getState?.()?.scene;
  if (scene?.children) {
    scene.children.forEach((child: any) => findMeshes(child, predicate, out));
  }
}
```
**Result**: 13 failed tests - `_fiber.root` structure doesn't provide scene access

### 8. Traverse R3F objects array
```typescript
if (!threeObj && node._fiber.objects && Array.isArray(node._fiber.objects)) {
  node._fiber.objects.forEach((obj: any) => {
    findMeshes(obj, predicate, out);
  });
}
```
**Result**: 13 failed tests - `_fiber.objects` doesn't exist or is empty

---

## Current Test Status

**Before Fix**: 16+ tests would crash with undefined errors
**After Fix**: 13 tests fail finding 0 meshes, 3 tests pass

**Failing Tests**:
- All `scenegraph.boardSquares.test.tsx` tests (3 tests)
- All `scenegraph.pieces.test.tsx` tests (4 tests) 
- Most `scenegraph.visibility.test.tsx` tests (5 tests)
- 1 `moveValidation.test.ts` test (unrelated to rendering)

**Passing Tests**:
- `scenegraph.boardSquares.test.tsx`: "should not calculate positions - must read from WorldSquare" (1 test)
- `scenegraph.visibility.test.tsx`: 2 visibility tests

---

## Next Steps

### Option 1: Version Mismatch Investigation
The PR fix mentions `node.__fiber` (double underscore) but only `node._fiber` (single underscore) exists in the current version. This suggests:
- The fix may be for a different version of `@react-three/test-renderer`
- Check package.json for version: `"@react-three/test-renderer": "^9.1.0"`
- Check if there's a newer/older version where the fix works
- Review test renderer changelog for breaking changes

### Option 2: Alternative Traversal Method
Since the root scene wrapper doesn't provide access to the Three.js scene:
- Use a different method to get the initial scene object
- Access the scene through the test renderer's internal store
- Modify `renderR3F()` to return the actual Three.js scene instead of the wrapper

### Option 3: Wrapper Detection Pattern
Implement a more robust detection of wrapper vs Three.js object:
```typescript
function isReactThreeTestInstance(node: any): boolean {
  return node._fiber && typeof node.instance !== 'undefined';
}

function getThreeObject(node: any): any {
  if (isReactThreeTestInstance(node)) {
    return node.instance || node._fiber?.object;
  }
  return node;
}
```

### Option 4: Use Test Renderer's toGraph()
The test renderer provides a `toGraph()` method that returns the scene graph:
```typescript
const renderer = await create(<Component />);
const graph = renderer.toGraph();  // Returns SceneGraph structure
```
Consider using this instead of custom traversal.

### Option 5: Access Scene via Store
The test renderer creates a store with the scene. Access it directly:
```typescript
// In renderR3F:
const root = await create(ui);
const store = root.getInstance();  // Might provide store access
const actualScene = store?.getState?.()?.scene;  // Get Three.js scene
return { root, scene: actualScene };  // Return Three.js scene, not wrapper
```

---

## Recommended Action

**Immediate**: Accept the partial fix (prevents crashes) and create tests that work around the limitation.

**Short-term**: Investigate Option 5 - modify `renderR3F()` to return the actual Three.js scene object instead of the wrapper, bypassing the entire issue.

**Long-term**: Submit issue to `@react-three/test-renderer` repository about incomplete fiber structure for root scene, or investigate if this is expected behavior that requires different usage pattern.

---

## Code References

- **File**: `src/test/threeTestUtils.tsx`
- **Function**: `findMeshes()` (lines 37-54)
- **Test Files**: 
  - `src/components/Board3D/__tests__/scenegraph.boardSquares.test.tsx`
  - `src/components/Board3D/__tests__/scenegraph.pieces.test.tsx`
  - `src/components/Board3D/__tests__/scenegraph.visibility.test.tsx`

## Related Issues

- PR #47: "Add rendering test infrastructure (Tier 1 & 2)" - introduced the tests
- Test renderer docs: `node_modules/@react-three/test-renderer/README.md`
- R3F fiber structure: Objects have `.__r3f` property with fiber data
---
## Restructured Rendering Test Plan (Architectural Fit)

Goal
- Make Tier 1 scene-graph tests stable, deterministic, and aligned with the app’s architecture by asserting on real Three.js Object3D and driving state via store fixtures.

Principles
- Assert on real Three objects, not wrapper nodes.
- Use deterministic store fixtures for state; avoid imperative updates in tests.
- Discover scene nodes via stable identifiers (userData.testId) over geometry heuristics.
- Keep tests colocated with components and focused on scenegraph assertions.

Contracts

1) renderR3F(ui, { storeState? }) → { root, scene }
- Mounts the component tree and returns:
  - root: the @react-three/test-renderer root
  - scene: the actual Three.Scene from the renderer store, not a wrapper
- Implementation pattern:
  - If storeState is provided, shallow-merge into useGameStore before create(ui)
  - const root = await create(ui)
  - const scene = root.getInstance?.()?.getState?.()?.scene || root.scene
  - return { root, scene }

2) findMeshes(node, predicate) → Mesh[]
- Traverses actual Object3D.children only.
- Never reads wrapper getters like node.type or node.children.
- If given a wrapper, unwrap via node.instance or node._fiber?.object, else assume node is Object3D.

3) findByUserData(node, key, value?) → Object3D[]
- Traverse Object3D.children; collect objects where obj.userData[key] exists and optionally equals value.

4) Component instrumentation (low-risk enhancement)
- Attach userData.testId to key meshes for stable selection:
  - Squares: userData.testId = "square"
  - Pieces: userData.testId = "piece"
  - Selector disks: userData.testId = "selector-disk"
  - Pin markers: userData.testId = "pin-marker"
- Prefer testId discovery over geometry heuristics when available.

5) Store fixtures
- Use src/test/storeFixtures.ts to produce deterministic world/pieces/trackStates:
  - buildWorldWithDefaults()
  - buildPiecesMinimal()
  - buildWorldWithVisibleBoards(attackIds: string[])
  - buildStoreState({ world?, pieces?, selectedBoardId?, highlightedSquareIds?, trackStates? })

Test Structure

- Location: src/components/Board3D/__tests__/
  - scenegraph.boardSquares.test.ts
    - Render <BoardRenderer /> with world fixture
    - Find square meshes via userData.testId === "square" (fallback: BoxGeometry heuristics)
    - Assert positions equal square.worldX/Y/Z
  - scenegraph.pieces.test.ts
    - Render <Pieces3D />
    - Find piece meshes via userData.testId === "piece" (fallback: geometry types)
    - Assert positions map to world square with Z + 0.5 offset
  - scenegraph.visibility.test.ts
    - Render <BoardRenderer /> with trackStates/world visibility fixture
    - Assert counts/visibility of selector disks and board squares via userData.testId
    - If needed, assert platform meshes via userData or geometry

Validation Loop

- Tight loop: run only one failing test at a time while iterating on utilities.
- Verify:
  - renderR3F returns a real Three.Scene (scene.isObject3D === true, scene.type === "Scene")
  - findMeshes discovers meshes when starting from scene
  - findByUserData returns expected counts when components set userData.testId
- When ready, run all scenegraph tests and confirm prior failures are resolved.

Version Matrix Requirements

- react, react-dom: ^19
- @react-three/fiber: ^9
- @react-three/drei: ^10 (peers fiber 9)
- @react-three/test-renderer: ^9.1
- Do not use --legacy-peer-deps; align versions explicitly.

Rationale

- Using the real Three.Scene bypasses wrapper getter pitfalls and incomplete root fiber.
- userData-based discovery is resilient to geometry changes and refactors.
- Deterministic store fixtures ensure stable, CI-friendly tests.

Handoff Checklist

- renderR3F returns actual Three.Scene via store access.
- findMeshes/findByUserData traverse Object3D.children only.
- Components expose userData.testId for targets used in tests.
- Store fixtures provide deterministic worlds, pieces, and trackStates.
- Scenegraph tests assert on Object3D.position/visible and pass locally with aligned versions.
