import { Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import type { WorldSquare } from '../../engine/world/types';

export function WorldGridVisualizer() {
  const world = useGameStore(state => state.world);

  return (
    <group>
      {Array.from(world.squares.values()).map((square: WorldSquare) => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
        >
          <boxGeometry args={[1.9, 1.9, 0.05]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      ))}

      {Array.from(world.squares.values()).map((square) => (
        <Text
          key={`label-${square.id}`}
          position={[square.worldX, square.worldY, square.worldZ + 0.3]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {square.id}
        </Text>
      ))}

      {Array.from(world.boards.values()).map(board => (
        <mesh
          key={`center-${board.id}`}
          position={[board.centerX, board.centerY, board.centerZ]}
        >
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </group>
  );
}
