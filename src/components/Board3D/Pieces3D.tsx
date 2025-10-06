import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Piece } from '../../engine/initialSetup';
import { THEME } from '../../config/theme';
import { fileToString } from '../../engine/world/coordinates';

/**
 * Renders all chess pieces.
 * For now, uses simple geometric shapes. Will replace with 3D models later.
 */
export function Pieces3D() {
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);

  // Debug: Log all piece positions once on mount
  React.useEffect(() => {
    console.log('\n=== PIECE POSITIONS ===');
    pieces.forEach((piece) => {
      const squareId = `${fileToString(piece.file)}${piece.rank}${piece.level}`;
      console.log(`${piece.color} ${piece.type}: ${squareId} (file=${piece.file}, rank=${piece.rank}, level=${piece.level})`);
    });
    console.log('======================\n');
  }, []);

  return (
    <group>
      {pieces.map((piece) => {
        const squareId = `${fileToString(piece.file)}${piece.rank}${piece.level}`;
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

/**
 * Simple geometric piece representation with text labels.
 * TODO: Replace with 3D models
 */
function SimplePiece({
  piece,
  position,
}: {
  piece: Piece;
  position: [number, number, number];
}) {
  const color = piece.color === 'white' ? THEME.pieces.white : THEME.pieces.black;

  // Different shapes and heights for different pieces
  const getPieceConfig = () => {
    switch (piece.type) {
      case 'pawn':
        return {
          geometry: <coneGeometry args={[0.3, 0.8, 16]} />,
          height: 0.8,
          scale: 0.4
        };
      case 'rook':
        return {
          geometry: <boxGeometry args={[0.5, 0.5, 1.0]} />,
          height: 1.0,
          scale: 0.5
        };
      case 'knight':
        return {
          geometry: <boxGeometry args={[0.4, 0.4, 1.2]} />,
          height: 1.2,
          scale: 0.5
        };
      case 'bishop':
        return {
          geometry: <coneGeometry args={[0.35, 1.2, 16]} />,
          height: 1.2,
          scale: 0.45
        };
      case 'queen':
        return {
          geometry: <octahedronGeometry args={[0.5]} />,
          height: 1.0,
          scale: 0.6
        };
      case 'king':
        return {
          geometry: <cylinderGeometry args={[0.4, 0.4, 1.4, 16]} />,
          height: 1.4,
          scale: 0.6
        };
      default:
        return {
          geometry: <boxGeometry args={[0.5, 0.5, 0.8]} />,
          height: 0.8,
          scale: 0.5
        };
    }
  };

  const config = getPieceConfig();

  return (
    <mesh position={position}>
      {config.geometry}
      <meshStandardMaterial
        color={color}
        metalness={THEME.pieces.metalness}
        roughness={THEME.pieces.roughness}
      />
    </mesh>
  );
}
