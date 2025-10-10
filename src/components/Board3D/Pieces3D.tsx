import { useGameStore } from '../../store/gameStore';
import type { Piece } from '../../store/gameStore';
import { THEME } from '../../config/theme';

export function Pieces3D() {
  const pieces = useGameStore(state => state.pieces);
  const world = useGameStore(state => state.world);
  const attackBoardStates = useGameStore(state => state.attackBoardStates);

  const resolveBoardId = (level: string): string => {
    if (level === 'W' || level === 'N' || level === 'B') return level;
    const active = (attackBoardStates as any)?.[level]?.activeInstanceId;
    return active ?? level;
  };

  return (
    <group>
      {pieces.map((piece) => {
        const boardId = resolveBoardId(piece.level);
        const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${boardId}`;
        const square = world.squares.get(squareId);

        if (!square) {
          console.error(`Square not found: ${squareId}`);
          return null;
        }

        return (
          <SimplePiece
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + 0.5]}
          />
        );
      })}
    </group>
  );
}

function SimplePiece({
  piece,
  position,
}: {
  piece: Piece;
  position: [number, number, number];
}) {
  const color = piece.color === 'white' ? THEME.pieces.white : THEME.pieces.black;
  
  const getGeometry = () => {
    switch (piece.type) {
      case 'pawn':
        return <coneGeometry args={[0.3, 0.8, 16]} />;
      case 'rook':
        return <boxGeometry args={[0.5, 0.5, 0.8]} />;
      case 'knight':
        return <boxGeometry args={[0.4, 0.6, 0.8]} />;
      case 'bishop':
        return <coneGeometry args={[0.35, 1.0, 16]} />;
      case 'queen':
        return <octahedronGeometry args={[0.4]} />;
      case 'king':
        return <cylinderGeometry args={[0.35, 0.35, 1.0, 16]} />;
    }
  };

  return (
    <mesh position={position} userData={{ testId: 'piece' }}>
      {getGeometry()}
      <meshStandardMaterial
        color={color}
        metalness={THEME.pieces.metalness}
        roughness={THEME.pieces.roughness}
      />
    </mesh>
  );
}
