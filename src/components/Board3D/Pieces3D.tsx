import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Piece } from '../../engine/initialSetup';
import { THEME } from '../../config/theme';
import { fileToString, createSquareId } from '../../engine/world/coordinates';
import { ThreeEvent } from '@react-three/fiber';

/**
 * Renders all chess pieces.
 * For now, uses simple geometric shapes. Will replace with 3D models later.
 */
export function Pieces3D() {
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);
  const selectedSquareId = useGameStore((state) => state.selectedSquareId);
  const selectSquare = useGameStore((state) => state.selectSquare);

  // Debug: Log all piece positions once on mount
  React.useEffect(() => {
    console.log('\n=== PIECE POSITIONS ===');
    pieces.forEach((piece) => {
      const squareId = `${fileToString(piece.file)}${piece.rank}${piece.level}`;
      console.log(`${piece.color} ${piece.type}: ${squareId} (file=${piece.file}, rank=${piece.rank}, level=${piece.level})`);
    });
    console.log('======================\n');
  }, []);

  const currentTurn = useGameStore((state) => state.currentTurn);
  const highlightedSquareIds = useGameStore((state) => state.highlightedSquareIds);
  const movePiece = useGameStore((state) => state.movePiece);
  const clearSelection = useGameStore((state) => state.clearSelection);

  const handlePieceClick = (piece: Piece, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const squareId = createSquareId(piece.file, piece.rank, piece.level);
    console.log(`Clicked ${piece.color} ${piece.type} at ${squareId}`);

    // If this is an enemy piece and we have a selected piece
    if (piece.color !== currentTurn && selectedSquareId) {
      // Check if this square is a valid move (capture)
      if (highlightedSquareIds.includes(squareId)) {
        console.log(`Capturing ${piece.color} ${piece.type} at ${squareId}`);
        const success = movePiece(selectedSquareId, squareId);
        if (success) {
          console.log('Capture successful!');
        } else {
          console.log('Capture failed!');
        }
        return;
      } else {
        // Clicked enemy piece but it's not a valid capture - clear selection
        clearSelection();
        return;
      }
    }

    // Otherwise, try to select this piece (if it's our piece)
    selectSquare(squareId);
  };

  return (
    <group>
      {pieces.map((piece) => {
        const squareId = `${fileToString(piece.file)}${piece.rank}${piece.level}`;
        const square = world.squares.get(squareId);

        if (!square) {
          console.error(`Square not found: ${squareId}`);
          return null;
        }

        const isSelected = selectedSquareId === squareId;

        return (
          <SimplePiece
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + 0.5]}
            isSelected={isSelected}
            onClick={(e) => handlePieceClick(piece, e)}
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
  isSelected,
  onClick,
}: {
  piece: Piece;
  position: [number, number, number];
  isSelected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
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

  // Visual feedback: lift piece when selected or hovered
  const finalPosition: [number, number, number] = [
    position[0],
    position[1],
    position[2] + (isSelected ? 0.5 : hovered ? 0.2 : 0)
  ];

  return (
    <mesh
      position={finalPosition}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {config.geometry}
      <meshStandardMaterial
        color={isSelected ? '#ffff00' : hovered ? '#aaaaaa' : color}
        metalness={THEME.pieces.metalness}
        roughness={THEME.pieces.roughness}
        emissive={isSelected ? '#ffaa00' : hovered ? '#444444' : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
      />
    </mesh>
  );
}
