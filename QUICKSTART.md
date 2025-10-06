# Quick Start Guide

## 🚀 Running the Application

The dev server is already running at: **http://localhost:5173/**

### Commands

```bash
# Development server (already running)
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- src/engine/world/__tests__/worldBuilder.test.ts

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔍 What You'll See

When you open http://localhost:5173/ in your browser:

1. **7 Colored Platforms**:
   - 3 brown main boards (White, Neutral, Black)
   - 4 orange attack boards (WQL, WKL, BQL, BKL)

2. **All Squares**:
   - Alternating light/dark checkerboard pattern
   - Correctly positioned in 3D space

3. **40 Chess Pieces**:
   - Simple geometric shapes (cones, boxes, cylinders)
   - 16 white pieces on lower boards
   - 16 black pieces on upper boards
   - Attack board pieces at edges

4. **Interactive Camera**:
   - **Left mouse drag**: Rotate view
   - **Right mouse drag**: Pan
   - **Mouse wheel**: Zoom in/out

5. **Console Debug Info**:
   - Open browser console (F12)
   - See detailed coordinate validation data

## 🧪 Validation Checklist

Open the browser and verify:

- [ ] All 7 boards are visible
- [ ] Squares form a continuous grid (ranks 0-9)
- [ ] White boards at bottom, black boards at top
- [ ] Attack boards positioned at corners
- [ ] All 40 pieces visible
- [ ] Pieces aligned with square centers
- [ ] Camera controls work smoothly
- [ ] No visual glitches or overlapping

## 🐛 Debug Mode (Optional)

To enable the wireframe debug visualizer, edit `src/components/Board3D/Board3D.tsx`:

```typescript
import { WorldGridVisualizer } from '../Debug/WorldGridVisualizer';

// Add inside <Canvas>:
<WorldGridVisualizer />
```

This will show:
- Cyan wireframe outlines of all squares
- White text labels for each square (e.g., "a2W", "z0WQL")
- Red spheres at board centers

## 📊 Test Results

All tests should pass:

```bash
npm test

# Expected output:
# ✓ src/engine/world/__tests__/worldBuilder.test.ts (9 tests)
# ✓ src/engine/world/__tests__/coordinateValidation.test.ts (11 tests)
# Test Files  2 passed (2)
# Tests  20 passed (20)
```

## 🎯 Key Features Implemented

✅ **World Grid System**
- 7 boards with pre-computed positions
- Continuous rank system (0-9)
- 12 pin positions for attack boards

✅ **Coordinate System**
- Single source of truth functions
- Same rank = same Y coordinate
- Same file = same X coordinate

✅ **Game State**
- Zustand store with world grid
- 40 pieces with initial positions
- Turn management ready

✅ **3D Rendering**
- Three.js with React integration
- Interactive camera controls
- Board and piece rendering

✅ **Testing**
- 20 comprehensive tests
- Coordinate validation
- Board creation validation

## 🔧 Troubleshooting

**Issue:** Server won't start
```bash
# Kill any running processes
killall node
# Restart
npm run dev
```

**Issue:** TypeScript errors
```bash
# Clean build
rm -rf dist node_modules
npm install --legacy-peer-deps
npm run build
```

**Issue:** Tests failing
```bash
# Run individual test files
npm test -- src/engine/world/__tests__/worldBuilder.test.ts --run
```

**Issue:** Black screen in browser OR React error
```bash
# This was already fixed! But if you encounter it:
# Ensure you have React 18 compatible versions:
npm install --legacy-peer-deps @react-three/fiber@8.17.10 @react-three/drei@9.114.3
npm run dev
```

**Issue:** Still seeing errors
- Check browser console for specific error messages
- Verify server is running at http://localhost:5173/
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache

## 📖 Next Steps

1. **Validate Visually**: Open browser and check alignment
2. **Review Console Logs**: Verify coordinate data
3. **Explore Camera**: Rotate to see all boards
4. **Read Implementation Guide**: `reference_docs/IMPLIMENTATION_GUIDE.md`
5. **Plan Phase 6**: Movement logic implementation

## 🎓 Learning Resources

- **Meder Rules**: `reference_docs/meder-rules.md`
- **Movement Tests**: `reference_docs/move_logic_tests.md`
- **Design Doc**: `reference_docs/DESIGN_DOC.md`
- **Progress Summary**: `PROGRESS_SUMMARY.md`

---

**Current Status:** ✅ Phases 1-5 Complete - Ready for Game Logic!
