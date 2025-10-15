import { useGLTF } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import type { Piece } from '../../store/gameStore';
import { THEME } from '../../config/theme';
import { resolveBoardId } from '../../utils/resolveBoardId';

export function Pieces3D() {
  const pieces = useGameStore(state => state.pieces);
  const world = useGameStore(state => state.world);
  const attackBoardStates = useGameStore(state => state.attackBoardStates);

  console.log('[Pieces3D] Rendering', pieces.length, 'pieces');
  console.log('[Pieces3D] attackBoardStates:', attackBoardStates);

  return (
    <group>
      {pieces.map((piece) => {
        const boardId = resolveBoardId(piece.level, attackBoardStates);
        const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${boardId}`;
        const square = world.squares.get(squareId);

        if (!square) {
          console.error('[Pieces3D] Square not found for piece:', {
            piece: { type: piece.type, color: piece.color, level: piece.level, file: piece.file, rank: piece.rank },
            resolvedBoardId: boardId,
            squareId,
            availableSquaresWithSameFileRank: Array.from(world.squares.keys())
              .filter(id => id.startsWith(`${['z','a','b','c','d','e'][piece.file]}${piece.rank}`)),
          });
          return null;
        }

        console.log('[Pieces3D] Rendering piece:', {
          type: piece.type,
          color: piece.color,
          level: piece.level,
          resolvedBoardId: boardId,
          squareId,
          position: [square.worldX, square.worldY, square.worldZ + THEME.pieces.zOffset],
        });

        return (
          <Model3DPiece
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + THEME.pieces.zOffset]}
          />
        );
      })}
    </group>
  );
}

function Model3DPiece({
  piece,
  position,
}: {
  piece: Piece;
  position: [number, number, number];
}) {
  const color = piece.color === 'white' ? THEME.pieces.white : THEME.pieces.black;
  const modelPath = `/models/chess/${THEME.pieces.modelSet}/${piece.type}.${THEME.pieces.modelFormat}`;

  const { scene } = useGLTF(modelPath);

  // Clone the scene to allow multiple instances
  const clonedScene = scene.clone();

  // Apply color to all meshes in the model
  clonedScene.traverse((child: any) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.color.set(color);
      child.material.metalness = THEME.pieces.metalness;
      child.material.roughness = THEME.pieces.roughness;
    }
  });

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={THEME.pieces.rotation}
      scale={THEME.pieces.scale}
      userData={{ testId: 'piece' }}
    />
  );
}

// Preload all models
const modelSet = THEME.pieces.modelSet;
const modelFormat = THEME.pieces.modelFormat;
const pieceTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
pieceTypes.forEach(type => {
  useGLTF.preload(`/models/chess/${modelSet}/${type}.${modelFormat}`);
});
