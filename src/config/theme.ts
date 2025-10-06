/**
 * Central theme configuration for the 3D chess board.
 * Customize colors, sizes, and visual properties here.
 */

export const THEME = {
  // Square colors
  squares: {
    light: '#F0D9B5',
    dark: '#B58863',
    opacity: 0.9,
    size: 1.9, // Leave small gap between squares
  },

  // Platform (board background) colors
  platforms: {
    main: '#8B4513',
    attack: '#A0522D',
    opacity: 0.7,
    thickness: 0.3,
  },

  // Piece colors
  pieces: {
    white: '#f5f5f5',
    black: '#2c2c2c',
    metalness: 0.3,
    roughness: 0.6,
  },

  // Highlight colors
  highlights: {
    selected: '#FFD700',
    validMove: '#90EE90',
    check: '#FF6347',
    opacity: 0.6,
  },

  // Lighting
  lighting: {
    ambient: {
      intensity: 0.6,
      color: '#ffffff',
    },
    directional: {
      intensity: 0.8,
      position: [10, 10, 10] as [number, number, number],
      color: '#ffffff',
    },
  },

  // Camera
  camera: {
    fov: 50,
    position: [0, -15, 20] as [number, number, number],
    lookAt: [0, 0, 5] as [number, number, number],
  },

  // Scene
  scene: {
    background: '#1a1a2e',
  },
};
