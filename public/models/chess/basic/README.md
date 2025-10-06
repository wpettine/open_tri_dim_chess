# Chess Piece 3D Models

This directory contains the 3D model files for chess pieces. The game will automatically load these models if they exist, or fall back to primitive geometric shapes if they don't.

## Required Files

Place the following GLTF/GLB files in this directory:

```
/public/models/chess/
├── pawn.glb
├── rook.glb
├── knight.glb
├── bishop.glb
├── queen.glb
└── king.glb
```

## How to Obtain Models

### Option 1: Sketchfab (Recommended)

1. Visit [Sketchfab Chess Models](https://sketchfab.com/tags/chess)
2. Filter by:
   - **License**: CC0 (Public Domain) or CC-BY (Attribution)
   - **Downloadable**: Yes
   - **Format**: Ensure GLTF/GLB is available
3. Recommended models:
   - Search for "low poly chess set" for better web performance
   - Look for complete sets with all 6 pieces

**Example Searches:**
- https://sketchfab.com/3d-models/chess-e54c2d04d4f74823b69ba4a794fb4500
- https://sketchfab.com/3d-models/low-poly-chess-pieces

### Option 2: CGTrader

1. Visit [CGTrader Free Chess Models](https://www.cgtrader.com/free-3d-models/chess)
2. Filter by:
   - **Price**: Free
   - **Formats**: glTF, glb, obj, fbx
3. Download and convert if needed (see below)

### Option 3: TurboSquid

1. Visit [TurboSquid Free Chess](https://www.turbosquid.com/Search/3D-Models/free/chess)
2. Download free models
3. Convert to GLTF if necessary

## File Format Requirements

- **Preferred**: `.glb` (Binary GLTF)
- **Also supported**: `.gltf` (JSON GLTF with separate textures)
- Models should be:
  - **Low-poly** (< 10k triangles per piece) for better performance
  - **Centered** at origin (0,0,0)
  - **Standing upright** along Z-axis
  - **Unit scale** (will be scaled programmatically)

## Converting Other Formats

If you download OBJ or FBX files, convert them to GLTF using:

### Online Converters
- https://products.aspose.app/3d/conversion/fbx-to-gltf
- https://anyconv.com/obj-to-gltf-converter/

### Command Line (Blender)
```bash
blender --background --python-expr "
import bpy
bpy.ops.import_scene.obj(filepath='input.obj')
bpy.ops.export_scene.gltf(filepath='output.glb', export_format='GLB')
"
```

### Using Blender GUI
1. Open Blender
2. Delete default cube (X key)
3. File → Import → choose format (OBJ/FBX)
4. Select all pieces (A key)
5. File → Export → glTF 2.0
6. Choose format: glTF Binary (.glb)
7. Save with piece name (e.g., `pawn.glb`)

## Testing

After adding models:
1. Refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Check the browser console for loading messages
3. If a model fails to load, the game will automatically use fallback geometry

## Troubleshooting

**Models not loading:**
- Check file names match exactly: `pawn.glb`, `rook.glb`, etc.
- Ensure files are in `/public/models/chess/` directory
- Check browser console for error messages
- Try hard refresh (Cmd+Shift+R)

**Models too large/small:**
- Adjust the `scale` prop in `Pieces3D.tsx` (currently 0.8)
- Default scale assumes pieces are roughly 1-2 units tall

**Models have wrong orientation:**
- Rotate in Blender before exporting
- Or adjust rotation in `ChessPieceModel.tsx`

## Current Status

🔄 **Currently using**: Primitive geometric shapes (fallback)
✅ **Ready for**: GLTF/GLB model files

Place your chess piece models in this directory to automatically upgrade the visuals!

## License Compliance

If using CC-BY licensed models:
- Add attribution in `ATTRIBUTIONS.md` in project root
- Include model creator's name and license
- Link to original source

Example:
```
Chess Pieces by [Artist Name]
Licensed under CC-BY 4.0
Source: [Sketchfab URL]
```
