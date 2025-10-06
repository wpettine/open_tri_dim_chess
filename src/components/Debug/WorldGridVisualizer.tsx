import { Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

/**
 * Debug component that visualizes the world grid.
 * Shows all squares as wireframes with labels.
 *
 * USAGE: Add to your scene during development to verify positions.
 */
export function WorldGridVisualizer() {
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {/* Render all squares as wireframes */}
      {Array.from(world.squares.values()).map((square) => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
        >
          <boxGeometry args={[1.9, 1.9, 0.05]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      ))}

      {/* Label each square */}
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

      {/* Show board centers */}
      {Array.from(world.boards.values()).map((board) => (
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
