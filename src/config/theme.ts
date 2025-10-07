export const THEME = {
  squares: {
    size: 2.0,
    light: '#F0D9B5',
    dark: '#B58863',
    opacity: 0.95,
  },
  platforms: {
    main: '#8B4513',
    attack: '#A0522D',
    opacity: 0.3,
    thickness: 0.3,
  },
  pieces: {
    white: '#f5f5f5',
    black: '#2c2c2c',
    metalness: 0.3,
    roughness: 0.4,
  },
  lighting: {
    ambient: {
      intensity: 0.6,
      color: '#ffffff',
    },
    directional: {
      intensity: 0.8,
      position: [10, 20, 10] as [number, number, number],
      color: '#ffffff',
    },
  },
  camera: {
    position: [15, 15, 20] as [number, number, number],
    fov: 50,
    lookAt: [5, 10, 4] as [number, number, number],
  },
  cameraPresets: {
    default: {
      position: [15, 15, 20] as [number, number, number],
      target: [5, 10, 4] as [number, number, number],
      up: [0, 1, 0] as [number, number, number],
    },
    top: {
      position: [5, 10, 25] as [number, number, number],
      target: [5, 10, 6] as [number, number, number],
      up: [0, 1, 0] as [number, number, number],
    },
    side: {
      position: [25, 10, 6] as [number, number, number],
      target: [5, 10, 6] as [number, number, number],
      up: [0, 0, 1] as [number, number, number],
    },
    front: {
      position: [5, -10, 10] as [number, number, number],
      target: [5, 10, 6] as [number, number, number],
      up: [0, 1, 0] as [number, number, number],
    },
  },
  scene: {
    background: '#1a1a2e',
  },
};
