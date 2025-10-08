export const THEME = {
  squares: {
    size: 2.0,
    light: '#DDE6F5',
    dark: '#1E3D8F',
    opacity: 0.3,
    selectedColor: '#ffff00',
    availableMoveColor: '#00ff00',
  },
  platforms: {
    whiteMain: '#C0C0C0',
    neutralMain: '#C0C0C0',
    blackMain: '#C0C0C0',
    attack: '#C0C0C0',
    opacity: 0.9,
    thickness: 0.2,
    gap: 0.2,
  },
  attackBoardSelector: {
    color: '#C2A14D',
    radius: 0.4,
    thickness: 0.08,
  },
  pinLocationDisk: {
    radius: 0.3,
    thickness: 0.06,
  },
  pieces: {
    white: '#f5f5f5',
    black: '#2c2c2c',
    metalness: 0.3,
    roughness: 0.4,
  },
  lighting: {
    ambient: {
      intensity: 0.7,
      color: '#ffffff',
    },
    directional: {
      intensity: 1.2,
      position: [10, 10, 20] as [number, number, number],
      color: '#ffffff',
      shadowMapSize: 2048,
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
      position: [-10, 0, 3] as [number, number, number],
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
    background: '#3C3C3C',
    backgroundEdge: '#1E1E1E',
  },
  typography: {
    fontFamily: 'Microgramma, sans-serif',
  },
};
