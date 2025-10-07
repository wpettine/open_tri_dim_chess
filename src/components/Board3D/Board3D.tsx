import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { THEME } from '../../config/theme';
import { useCameraStore } from '../../store/cameraStore';
import { BoardRenderer } from './BoardRenderer';
import { WorldGridVisualizer } from '../Debug/WorldGridVisualizer';
import { Pieces3D } from './Pieces3D';

function CameraController() {
  const currentView = useCameraStore(state => state.currentView);
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>();

  const preset = THEME.cameraPresets[currentView];

  useEffect(() => {
    if (controlsRef.current && preset) {
      gsap.to(camera.position, {
        x: preset.position[0],
        y: preset.position[1],
        z: preset.position[2],
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.to(controlsRef.current.target, {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => controlsRef.current?.update(),
      });
    }
  }, [currentView, camera, preset]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={THEME.camera.lookAt}
      minDistance={5}
      maxDistance={50}
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
    />
  );
}

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

      <CameraController />

      <WorldGridVisualizer />

      <BoardRenderer />
      
      <Pieces3D />
    </Canvas>
  );
}
