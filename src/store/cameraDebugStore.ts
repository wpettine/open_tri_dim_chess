import { create } from 'zustand';
import type { Vector3 } from 'three';

interface CameraDebugState {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  update: (position: Vector3, target: Vector3, up: Vector3) => void;
}

function round3(value: number): number {
  return Math.round(value * 100) / 100;
}

export const useCameraDebugStore = create<CameraDebugState>((set) => ({
  position: [0, 0, 0],
  target: [0, 0, 0],
  up: [0, 1, 0],
  update: (position, target, up) => {
    set({
      position: [round3(position.x), round3(position.y), round3(position.z)],
      target: [round3(target.x), round3(target.y), round3(target.z)],
      up: [round3(up.x), round3(up.y), round3(up.z)],
    });
  },
}));

