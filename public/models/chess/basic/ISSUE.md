# Issue with Current GLTF Files

## Problem

The GLTF files in this directory are **incomplete**. They reference an external binary file `scene.bin` that is missing:

```json
"uri": "scene.bin"
```

This causes a loading error: `Invalid typed array length: 196596`

## Why This Happens

GLTF files come in two formats:

1. **GLTF with separate .bin** - JSON file + binary .bin file (what you have, but .bin is missing)
2. **GLB (Binary GLTF)** - Single self-contained binary file (recommended)

Your files are type #1 but are missing the required `.bin` companion files.

## Solutions

### Option 1: Download GLB Files (Recommended)

Download complete GLB files from Sketchfab:

1. Go to https://sketchfab.com/3d-models/chess-pieces
2. Look for models with **"Downloadable"** badge
3. Download and select **"glTF Binary (.glb)"** format
4. Extract and rename files to:
   - `pawn.glb`
   - `rook.glb`
   - `knight.glb`
   - `bishop.glb`
   - `queen.glb`
   - `king.glb`
5. Update config: `modelSet: 'basic'` and `modelFormat: 'glb'`

### Option 2: Get the Missing .bin Files

If you know where these GLTF files came from, find the corresponding `scene.bin` file and place it in this directory.

### Option 3: Use Fallback Primitives (Current)

The game currently uses primitive geometric shapes (spheres, cones, boxes) as fallback since the models can't load.

To enable this permanently:
- Config is already set to `modelSet: 'none'`

## Recommended Free Chess Models

### Low Poly Chess Set
- **Link**: https://sketchfab.com/3d-models/chess-set-low-poly-dd1d6903db684c2c8e8b9e926a847e13
- **Format**: GLB available
- **License**: CC-BY-4.0
- **Download**: Click "Download 3D Model" → Select "glTF Binary (.glb)"

### Simple Chess Pieces
- **Link**: https://sketchfab.com/3d-models/simple-chess-pieces-b6c56b3c5e394743b6d3f546a16e2f2d
- **Format**: GLB available
- **License**: CC0 (Public Domain)

## After Getting New Models

1. Delete the broken `.gltf` files
2. Place new `.glb` files here with correct names
3. Update `/src/config/theme.ts`:
   ```typescript
   pieces: {
     modelSet: 'basic',
     modelFormat: 'glb',
     // ...
   }
   ```
4. Refresh browser (Cmd+Shift+R)

## Current Status

❌ **Current files**: Incomplete (missing .bin files)
✅ **Fallback**: Using primitive shapes
⚠️ **Action needed**: Replace with complete GLB files
