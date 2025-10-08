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
  const selectSquare = useGameStore(state => state.selectSquare);
  const selectBoard = useGameStore(state => state.selectBoard);
  const selectedSquareId = useGameStore(state => state.selectedSquareId);
  const highlightedSquareIds = useGameStore(state => state.highlightedSquareIds);

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

        {board.type !== 'main' && (
          <mesh
            position={[0, 0, 0.06]}
            onClick={(e) => {
              e.stopPropagation();
              selectBoard(board.id);
            }}
          >
            <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
            <meshStandardMaterial color="#cc3333" emissive="#550000" emissiveIntensity={0.5} />
          </mesh>
        )}
      </group>

      {squares.map((square) => {
        const isSelected = square.id === selectedSquareId;
        const isLegalMove = highlightedSquareIds.includes(square.id);
        
        return (
          <mesh
            key={square.id}
            position={[square.worldX, square.worldY, square.worldZ]}
            onClick={() => {
              if (board.type !== 'main') {
                selectBoard(board.id);
              }
              selectSquare(square.id);
            }}
          >
            <boxGeometry args={[THEME.squares.size, THEME.squares.size, 0.1]} />
            <meshStandardMaterial
              color={
                isSelected ? '#ffff00' :
                isLegalMove ? '#00ff00' :
                square.color === 'light' ? THEME.squares.light : THEME.squares.dark
              }
              transparent
              opacity={isLegalMove ? 0.7 : THEME.squares.opacity}
            />
          </mesh>
        );
      })}
    </group>
  );
}
