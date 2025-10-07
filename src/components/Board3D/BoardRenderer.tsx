import { useGameStore } from '../../store/gameStore';
import type { BoardLayout, WorldSquare } from '../../engine/world/types';
import { THEME } from '../../config/theme';

export function BoardRenderer() {
  const world = useGameStore(state => state.world);

  return (
    <group>
      {Array.from(world.boards.values()).map(board => (
        <SingleBoard key={board.id} board={board} />
      ))}
    </group>
  );
}

function SingleBoard({ board }: { board: BoardLayout }) {
  const world = useGameStore(state => state.world);

  const squares = Array.from(world.squares.values()).filter(
    (sq: WorldSquare) => sq.boardId === board.id
  );

  return (
    <group>
      <group
        position={[board.centerX, board.centerY, board.centerZ]}
        rotation={[0, 0, (board.rotation * Math.PI) / 180]}
      >
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry
            args={[
              board.size.width * 2.1,
              board.size.height * 2.1,
              THEME.platforms.thickness,
            ]}
          />
          <meshStandardMaterial
            color={board.type === 'main' ? THEME.platforms.main : THEME.platforms.attack}
            transparent
            opacity={THEME.platforms.opacity}
          />
        </mesh>
      </group>

      {squares.map((square) => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
          onClick={() => console.log('Clicked square:', square.id)}
        >
          <boxGeometry args={[THEME.squares.size, THEME.squares.size, 0.1]} />
          <meshStandardMaterial
            color={square.color === 'light' ? THEME.squares.light : THEME.squares.dark}
            transparent
            opacity={THEME.squares.opacity}
          />
        </mesh>
      ))}
    </group>
  );
}
