# Chess Piece 3D Models

This directory contains 3D model sets for chess pieces. Each set is stored in its own subfolder, allowing you to easily switch between different piece styles.

## Directory Structure

```
/public/models/chess/
├── basic/              # Example: Basic piece set
│   ├── pawn.gltf
│   ├── rook.gltf
│   ├── knight.gltf
│   ├── bishop.gltf
│   ├── queen.gltf
│   └── king.gltf
├── your-set-name/      # Add your own sets here
│   ├── pawn.glb
│   ├── rook.glb
│   └── ...
└── README.md
```

## How to Switch Piece Sets

1. **Create a new folder** in `/public/models/chess/` with your set name (e.g., "medieval", "modern", "minimalist")

2. **Place all 6 piece models** in that folder:
   - `pawn.gltf` (or `.glb`)
   - `rook.gltf`
   - `knight.gltf`
   - `bishop.gltf`
   - `queen.gltf`
   - `king.gltf`

3. **Edit the config** at `src/config/theme.ts`:

```typescript
pieces: {
  modelSet: 'your-set-name',  // Folder name
  modelFormat: 'gltf',        // or 'glb'
  // ...
}
```

That's it! The game will automatically load pieces from the specified folder.

## File Format Requirements

- **Preferred**: `.gltf` or `.glb` (GLTF format)
- Models should be:
  - **Low-poly** (< 10k triangles per piece) for better performance
  - **Centered** at origin (0,0,0)
  - **Standing upright** along Z-axis
  - **Unit scale** (will be scaled programmatically via theme config)

## Color Handling

The game automatically recolors all pieces based on team:
- **White pieces**: Use `BOARD_THEME.pieces.white.primary` color
- **Black pieces**: Use `BOARD_THEME.pieces.black.primary` color

The original model color doesn't matter - it will be replaced at runtime.

## Current Model Set

Currently active: **`basic`** (configured in `src/config/theme.ts`)

## Adding New Sets

1. Download or create your models
2. Create a new folder with a descriptive name
3. Place models with correct filenames
4. Update `modelSet` in theme config
5. Optionally adjust `scale` in theme config if pieces are too large/small

## Fallback Behavior

If a model fails to load, the game will automatically fall back to primitive geometric shapes (spheres, cones, boxes) so gameplay is never interrupted.
