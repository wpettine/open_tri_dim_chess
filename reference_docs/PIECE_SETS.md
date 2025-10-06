# 3D Chess Piece Sets

## Overview

The game now supports multiple 3D model sets for chess pieces. You can easily switch between different piece styles by placing models in folders and updating a simple config file.

## Quick Start

### Switch to the Basic Piece Set (Already Configured)

The game is currently configured to use the "basic" piece set:

```typescript
// In src/config/theme.ts
pieces: {
  modelSet: 'basic',      // ← Folder name
  modelFormat: 'gltf',    // ← File extension
  // ...
}
```

All models are loaded from: `/public/models/chess/basic/`

### Add Your Own Piece Set

1. **Create a folder** in `/public/models/chess/` with your set name:
   ```
   /public/models/chess/medieval/
   ```

2. **Add all 6 piece models** with these exact filenames:
   - `pawn.gltf` (or `.glb`)
   - `rook.gltf`
   - `knight.gltf`
   - `bishop.gltf`
   - `queen.gltf`
   - `king.gltf`

3. **Update the config** at `src/config/theme.ts`:
   ```typescript
   pieces: {
     modelSet: 'medieval',  // ← Change this
     modelFormat: 'gltf',   // ← or 'glb' if using GLB files
     // ...
   }
   ```

4. **Save** - The app will automatically reload with your new pieces!

## Available Model Sets

### Basic (Current)
- **Location**: `/public/models/chess/basic/`
- **Format**: GLTF (`.gltf`)
- **Style**: Simple, clean designs
- **License**: See individual `*_license.txt` files in the folder

### Add More Sets Here
Create additional folders for different styles:
- `medieval/` - Medieval/fantasy style
- `modern/` - Modern minimalist
- `classic/` - Traditional Staunton
- `futuristic/` - Sci-fi themed
- etc.

## Configuration Options

### Model Set
```typescript
modelSet: 'basic'  // Folder name in /public/models/chess/
```

### Model Format
```typescript
modelFormat: 'gltf'  // Options: 'gltf' or 'glb'
```

### Piece Scale
```typescript
scale: 0.8  // Adjust size (0.5 = 50%, 1.0 = 100%, 1.5 = 150%)
```

### Piece Colors
The game automatically recolors all models:
```typescript
white: {
  primary: '#f5f5f5',   // White pieces
},
black: {
  primary: '#2a2a2a',   // Black pieces
}
```

Original model colors are replaced at runtime, so any colored model will work.

## Model Requirements

### File Format
- ✅ GLTF (`.gltf`) - Recommended
- ✅ GLB (`.glb`) - Binary GLTF
- ❌ OBJ, FBX, STL - Not supported (convert to GLTF first)

### Geometry
- **Low-poly preferred**: < 10,000 triangles per piece
- **Centered at origin**: (0, 0, 0)
- **Upright orientation**: Standing along Z-axis
- **Unit scale**: Will be scaled via `scale` config parameter

### Textures
- Original textures/colors will be replaced
- Materials will be recolored to white/black automatically
- Metalness: 0.3, Roughness: 0.7 (applied automatically)

## Troubleshooting

### Models Not Loading
1. Check folder name matches `modelSet` in config
2. Check file extension matches `modelFormat` in config
3. Verify all 6 piece files exist with correct names
4. Check browser console for error messages
5. Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Models Too Large/Small
Adjust the `scale` parameter in `src/config/theme.ts`:
```typescript
pieces: {
  scale: 1.2,  // Make 20% larger
}
```

### Models Wrong Orientation
Models should be:
- **Standing upright** (not lying flat)
- **Facing forward** along +Y axis
- If wrong, rotate in Blender before exporting

### Performance Issues
- Use low-poly models (< 10k triangles)
- Consider using GLB format (smaller file size)
- Reduce model detail if game is slow

## Converting Other Formats

If you have OBJ or FBX files, convert to GLTF:

### Using Blender
1. Open Blender
2. Delete default cube (X key)
3. File → Import → choose your format (OBJ/FBX)
4. File → Export → glTF 2.0
5. Choose format: glTF Binary (.glb) or glTF Separate (.gltf)
6. Save with piece name (e.g., `pawn.glb`)

### Online Converters
- https://products.aspose.app/3d/conversion/fbx-to-gltf
- https://anyconv.com/obj-to-gltf-converter/

## Example: Creating a Custom Set

Let's add a "futuristic" set:

1. **Create folder**:
   ```bash
   mkdir /public/models/chess/futuristic
   ```

2. **Add models** (all 6 pieces as .gltf or .glb)

3. **Update config** (`src/config/theme.ts`):
   ```typescript
   pieces: {
     modelSet: 'futuristic',
     modelFormat: 'glb',
     scale: 1.0,
     // ... rest stays same
   }
   ```

4. **Done!** The game now uses futuristic pieces.

## Finding Models

### Free Sources
- **Sketchfab**: Search "chess pieces" with CC0/CC-BY license
- **CGTrader**: Filter by free + GLTF format
- **TurboSquid**: Search "free chess pieces"

### License Requirements
- CC0 (Public Domain) - No attribution needed
- CC-BY - Add attribution to ATTRIBUTIONS.md
- Commercial - Check license terms

## Current Setup

```
✅ Basic piece set integrated
✅ Auto-recoloring system active
✅ Easy switching via config
✅ Fallback to primitives if models fail
✅ Full documentation provided
```

See also:
- `THEME_GUIDE.md` - Complete theme customization guide
- `/public/models/chess/README.md` - Model directory info
- `/public/models/chess/basic/README.md` - Basic set details
