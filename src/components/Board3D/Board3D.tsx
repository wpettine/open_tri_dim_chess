import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { THEME } from '../../config/theme';
import { BoardRenderer } from './BoardRenderer';
import { Pieces3D } from './Pieces3D';

/**
 * Main 3D scene component.
 * Sets up the Three.js canvas with camera, lights, and controls.
 */
export function Board3D() {
  return (
    <Canvas
      camera={{
        position: THEME.camera.position,
        fov: THEME.camera.fov,
      }}
      style={{ background: THEME.scene.background }}
    >
      {/* Lighting */}
      <ambientLight
        intensity={THEME.lighting.ambient.intensity}
        color={THEME.lighting.ambient.color}
      />
      <directionalLight
        intensity={THEME.lighting.directional.intensity}
        position={THEME.lighting.directional.position}
        color={THEME.lighting.directional.color}
      />

      {/* Camera controls */}
      <OrbitControls
        target={THEME.camera.lookAt}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />

      {/* Board renderer */}
      <BoardRenderer />

      {/* Piece renderer */}
      <Pieces3D />
    </Canvas>
  );
}
