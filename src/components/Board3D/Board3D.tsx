import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { THEME } from '../../config/theme';
import { BoardRenderer } from './BoardRenderer';
import { WorldGridVisualizer } from '../Debug/WorldGridVisualizer';
import { Pieces3D } from './Pieces3D';

export function Board3D() {
  return (
    <Canvas
      camera={{
        position: THEME.camera.position,
        fov: THEME.camera.fov,
      }}
      style={{ background: THEME.scene.background }}
    >
      <ambientLight
        intensity={THEME.lighting.ambient.intensity}
        color={THEME.lighting.ambient.color}
      />
      <directionalLight
        intensity={THEME.lighting.directional.intensity}
        position={THEME.lighting.directional.position}
        color={THEME.lighting.directional.color}
      />

      <OrbitControls
        target={THEME.camera.lookAt}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />

      <WorldGridVisualizer />

      <BoardRenderer />
      
      <Pieces3D />
    </Canvas>
  );
}
