# Theme Configuration Guide

This guide explains how to customize the visual appearance of the 3D chess board using the centralized theme configuration.

## Overview

All styling for the 3D chess board is now controlled through a single configuration file:
- **File**: `src/config/theme.ts`
- **Export**: `BOARD_THEME` object

## Theme Structure

### 1. Board Squares (`BOARD_THEME.squares`)
Controls the appearance of individual chess squares:
```typescript
squares: {
  light: '#F0D9B5',     // Light square color
  dark: '#B58863',      // Dark square color
  opacity: 0.75,        // Transparency level
  gap: 0.1,            // Gap between squares (units)
}
```

### 2. Board Platforms (`BOARD_THEME.platforms`)
Controls the platform/base of each board level:
```typescript
platforms: {
  whiteMain: '#8B7355',    // White main board color
  neutralMain: '#A0826D',  // Neutral main board color
  blackMain: '#6F5645',    // Black main board color
  attack: '#D4AF37',       // Attack boards color (gold)
  opacity: 0.7,            // Transparency level
  thickness: 0.2,          // Platform thickness (units)
  gap: 0.2,               // Gap from board edge (units)
}
```

### 3. Board Labels (`BOARD_THEME.labels`)
Controls the colored cubes that identify each board level:
```typescript
labels: {
  white: '#ffffff',     // White board label
  neutral: '#888888',   // Neutral board label
  black: '#000000',     // Black board label
  attack: '#D4AF37',    // Attack board labels (gold)
  size: 0.5,           // Label cube size (units)
}
```

### 4. Support Pillars (`BOARD_THEME.pillars`)
Controls the pillars under attack boards:
```typescript
pillars: {
  color: '#C0C0C0',    // Silver/gray color
  radius: 0.1,         // Cylinder radius (units)
  // Note: height is automatically calculated from spacing.attackBoardZOffset
}
```

**Note:** Pillar height automatically matches `spacing.attackBoardZOffset` to connect attack boards to their respective main boards.

### 5. Chess Pieces (`BOARD_THEME.pieces`)
Controls piece models, colors, and selection indicators:
```typescript
pieces: {
  // 3D Model Configuration
  modelSet: 'basic',       // Folder name in /public/models/chess/
  modelFormat: 'gltf',     // File extension: 'gltf' or 'glb'

  white: {
    primary: '#f5f5f5',     // 3D model color
    fallback: '#FFFFFF',    // Fallback geometry color
  },
  black: {
    primary: '#2a2a2a',     // 3D model color
    fallback: '#1a1a1a',    // Fallback geometry color
  },
  selection: {
    color: '#FFD700',           // Selection ring color (gold)
    emissive: '#FFD700',        // Selection ring glow
    emissiveIntensity: 0.5,     // Glow intensity
  },
  scale: 0.8,              // Default piece scale
}
```

### 6. Valid Move Indicators (`BOARD_THEME.moves`)
Controls the visual indicators for valid moves:
```typescript
moves: {
  valid: '#44FF44',     // Green for normal moves
  capture: '#FF4444',   // Red for capture moves
  opacity: 0.5,         // Transparency level
  size: 0.4,           // Indicator size (units)
}
```

### 7. Board Spacing (`BOARD_THEME.spacing`)
Controls the Z-axis positioning of boards in 3D space:
```typescript
spacing: {
  mainBoardZSpacing: 4,     // Z-axis distance between main boards (WL→NL, NL→BL)
  attackBoardZOffset: 2,    // Height of attack boards above their respective main boards
}
```

**How it works:**
- White main board is at Z=0 (base level)
- Neutral main board is at Z=`mainBoardZSpacing` (default: 4)
- Black main board is at Z=`2 × mainBoardZSpacing` (default: 8)
- White attack boards are at Z=`attackBoardZOffset` (default: 2)
- Black attack boards are at Z=`(2 × mainBoardZSpacing) + attackBoardZOffset` (default: 10)

**Tips:**
- Increase `mainBoardZSpacing` to spread boards further apart vertically
- Increase `attackBoardZOffset` to raise attack boards higher above main boards
- Pillar heights automatically adjust to match `attackBoardZOffset`
- Changes apply automatically without modifying coordinate system code

### 8. Scene Lighting (`BOARD_THEME.lighting`)
Controls ambient and directional lighting:
```typescript
lighting: {
  ambient: {
    intensity: 0.6,    // Overall ambient light level
  },
  directional: {
    position: [10, 10, 20],  // Light position [x, y, z]
    intensity: 1,            // Light strength
    shadowMapSize: 2048,     // Shadow quality
  },
}
```

### 8. Camera (`BOARD_THEME.camera`)
Controls initial camera position and target:
```typescript
camera: {
  position: [15, -6, 18],  // Camera position [x, y, z]
  target: [0, 4, 4],       // Camera look-at point [x, y, z]
}
```

### 9. Grid Helper (`BOARD_THEME.grid`)
Controls the reference grid on the ground plane:
```typescript
grid: {
  size: 40,                      // Grid size (units)
  divisions: 40,                 // Number of grid divisions
  position: [0, 0, -0.1],       // Grid position [x, y, z]
  rotation: [Math.PI/2, 0, 0],  // Grid rotation [x, y, z]
}
```

### 10. UI Colors (`BOARD_THEME.ui`)
Controls colors for UI elements:
```typescript
ui: {
  background: '#1a1a1a',           // Main background color
  controlBackground: 'rgba(0, 0, 0, 0.8)',  // Control panel background
  controlText: 'white',            // Control panel text
  buttonBackground: '#4a5568',     // Button color
  buttonHover: '#718096',          // Button hover color
  statusBackground: {
    white: '#e8e8e8',    // White turn indicator
    black: '#333333',    // Black turn indicator
    check: '#ffcc00',    // Check warning
    checkmate: '#ff0000', // Checkmate alert
  },
}
```

## How to Customize

### Example 1: Change Board Colors to Blue Theme
```typescript
// In src/config/theme.ts
platforms: {
  whiteMain: '#6495ED',    // Cornflower blue
  neutralMain: '#4169E1',  // Royal blue
  blackMain: '#000080',    // Navy blue
  attack: '#1E90FF',       // Dodger blue
  // ... rest stays the same
}
```

### Example 2: Switch to a Different Piece Set
```typescript
// In src/config/theme.ts
pieces: {
  modelSet: 'medieval',    // Changed from 'basic' to 'medieval'
  modelFormat: 'glb',      // Changed format if needed
  // ... rest stays the same
}
```

Note: Make sure `/public/models/chess/medieval/` folder exists with all 6 piece models.

### Example 3: Make Pieces Larger
```typescript
// In src/config/theme.ts
pieces: {
  // ... other settings stay the same
  scale: 1.0,  // Changed from 0.8 to 1.0
}
```

### Example 4: Adjust Lighting
```typescript
// In src/config/theme.ts
lighting: {
  ambient: {
    intensity: 0.8,  // Brighter ambient light
  },
  directional: {
    position: [20, 20, 30],  // Move light further away
    intensity: 1.5,          // Stronger directional light
    shadowMapSize: 2048,
  },
}
```

### Example 5: Change Move Indicator Colors
```typescript
// In src/config/theme.ts
moves: {
  valid: '#00FFFF',    // Cyan for valid moves
  capture: '#FF00FF',  // Magenta for captures
  opacity: 0.7,        // More opaque
  size: 0.4,
}
```

### Example 6: Adjust Board Spacing
```typescript
// In src/config/theme.ts
spacing: {
  mainBoardZSpacing: 6,     // Increased from 4 - more vertical separation
  attackBoardZOffset: 3,    // Increased from 2 - raise attack boards higher
}
```

**Result:**
- Main boards will be further apart vertically (6 units instead of 4)
- Neutral board at Z=6 (instead of 4)
- Black board at Z=12 (instead of 8)
- Attack boards hover 3 units above their main boards (instead of 2)

## Managing 3D Piece Models

### Adding a New Piece Set

1. **Create folder structure**:
   ```
   /public/models/chess/your-set-name/
   ├── pawn.gltf
   ├── rook.gltf
   ├── knight.gltf
   ├── bishop.gltf
   ├── queen.gltf
   └── king.gltf
   ```

2. **Update theme config**:
   ```typescript
   pieces: {
     modelSet: 'your-set-name',
     modelFormat: 'gltf',  // or 'glb'
     // ...
   }
   ```

3. **Adjust scale if needed**:
   ```typescript
   pieces: {
     // ...
     scale: 1.2,  // Make pieces 20% larger
   }
   ```

### Model Requirements
- Format: `.gltf` or `.glb`
- Low-poly recommended (< 10k triangles)
- Centered at origin (0,0,0)
- Upright along Z-axis
- Original color doesn't matter (auto-recolored)

See `/public/models/chess/README.md` for detailed model integration guide.

## Files That Use the Theme

The following components import and use the theme configuration:

1. **Board3D.tsx** - Main 3D scene setup (camera, lighting, grid)
2. **BoardRenderer.tsx** - Board platforms, squares, labels, pillars
3. **ChessPieceModel.tsx** - Piece colors and model loading
4. **Pieces3D.tsx** - Piece scale and selection indicators
5. **ValidMoveIndicators.tsx** - Move indicator colors
6. **Game.tsx** - UI background color

## Tips

- **Colors**: Use hex format (`#RRGGBB`) for all colors
- **Transparency**: Values from 0 (invisible) to 1 (opaque)
- **Positions**: In world units [x, y, z]
- **Sizes**: In world units (1 unit = approximately 1 meter in the scene)
- **After Changes**: Save the file and the app will hot-reload automatically

## Presets

You can create theme presets by duplicating the `BOARD_THEME` object:

```typescript
// Example: Classic wood theme
export const CLASSIC_THEME = {
  ...BOARD_THEME,
  squares: {
    light: '#F0D9B5',
    dark: '#B58863',
    opacity: 0.9,
    gap: 0.1,
  },
  // ... override other properties
};

// Example: Modern neon theme
export const NEON_THEME = {
  ...BOARD_THEME,
  squares: {
    light: '#00FFFF',
    dark: '#FF00FF',
    opacity: 0.8,
    gap: 0.1,
  },
  // ... override other properties
};
```

Then switch between themes by changing the import in your components.

