import { useGameStore } from '../../store/gameStore';
import { BoardLayout } from '../../engine/world/types';
import { THEME } from '../../config/theme';
import { ThreeEvent } from '@react-three/fiber';
import { useState } from 'react';

/**
 * Renders all chess boards (main and attack).
 */
export function BoardRenderer() {
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {Array.from(world.boards.values()).map((board) => (
        <SingleBoard key={board.id} board={board} />
      ))}
    </group>
  );
}

/**
 * Renders a single board with its platform and squares.
 */
function SingleBoard({ board }: { board: BoardLayout }) {
  const world = useGameStore((state) => state.world);
  const selectedSquareId = useGameStore((state) => state.selectedSquareId);
  const highlightedSquareIds = useGameStore((state) => state.highlightedSquareIds);
  const movePiece = useGameStore((state) => state.movePiece);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const pieces = useGameStore((state) => state.pieces);

  // Get all squares for this board
  const squares = Array.from(world.squares.values()).filter(
    (sq) => sq.boardId === board.id
  );

  const handleSquareClick = (squareId: string, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // If we have a selected piece and this square is highlighted (valid move)
    if (selectedSquareId && highlightedSquareIds.includes(squareId)) {
      console.log(`Moving piece from ${selectedSquareId} to ${squareId}`);
      const success = movePiece(selectedSquareId, squareId);
      if (success) {
        console.log('Move successful!');
      } else {
        console.log('Move failed!');
      }
    } else if (selectedSquareId) {
      // Clicked on non-valid square, clear selection
      clearSelection();
    }
  };

  return (
    <group>
      {/* Platform (visual background for board) */}
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

      {/* Squares (NOT rotated - always at absolute positions) */}
      {squares.map((square) => {
        const isHighlighted = highlightedSquareIds.includes(square.id);
        const hasPiece = pieces.some(p =>
          p.file === square.file && p.rank === square.rank && p.level === square.boardId
        );

        return (
          <Square
            key={square.id}
            square={square}
            isHighlighted={isHighlighted}
            hasPiece={hasPiece}
            onClick={(e) => handleSquareClick(square.id, e)}
          />
        );
      })}
    </group>
  );
}

/**
 * Individual square component with hover effects
 */
function Square({
  square,
  isHighlighted,
  onClick,
}: {
  square: any;
  isHighlighted: boolean;
  hasPiece: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={[square.worldX, square.worldY, square.worldZ]}
      onClick={onClick}
      onPointerOver={(e) => {
        if (isHighlighted) {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={[THEME.squares.size, THEME.squares.size, 0.1]} />
      <meshStandardMaterial
        color={
          isHighlighted
            ? (hovered ? '#00ff00' : '#00cc00')
            : square.color === 'light'
              ? THEME.squares.light
              : THEME.squares.dark
        }
        transparent
        opacity={isHighlighted ? 0.8 : THEME.squares.opacity}
        emissive={isHighlighted ? '#00aa00' : '#000000'}
        emissiveIntensity={isHighlighted ? (hovered ? 0.6 : 0.3) : 0}
      />
    </mesh>
  );
}
