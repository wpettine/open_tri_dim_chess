import { useGameStore } from '../../store/gameStore';
import type { BoardLayout, WorldSquare } from '../../engine/world/types';
import { THEME } from '../../config/theme';
import { PIN_POSITIONS } from '../../engine/world/pinPositions';
import { fileToWorldX, rankToWorldY } from '../../engine/world/coordinates';

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
  const selectedBoardId = useGameStore(state => state.selectedBoardId);
  const canMoveBoard = useGameStore(state => state.canMoveBoard);

  const squares = Array.from(world.squares.values()).filter(
    (sq: WorldSquare) => sq.boardId === board.id
  );

  const eligiblePins = new Set<string>();
  if (selectedBoardId && board.type === 'main') {
    Object.keys(PIN_POSITIONS).forEach(pinId => {
      const result = canMoveBoard(selectedBoardId, pinId);
      if (result.allowed) {
        eligiblePins.add(pinId);
      }
    });
  }

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
            color={
              board.type === 'attack' ? THEME.platforms.attack :
              board.id === 'WL' ? THEME.platforms.whiteMain :
              board.id === 'NL' ? THEME.platforms.neutralMain :
              THEME.platforms.blackMain
            }
            transparent
            opacity={THEME.platforms.opacity}
          />
        </mesh>

        {board.type !== 'main' && (
          <mesh
            position={[0, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              selectBoard(board.id);
            }}
          >
            <cylinderGeometry args={[THEME.attackBoardSelector.radius, THEME.attackBoardSelector.radius, THEME.attackBoardSelector.thickness, 32]} />
            <meshStandardMaterial 
              color={selectedBoardId === board.id ? THEME.squares.selectedColor : THEME.attackBoardSelector.color}
            />
          </mesh>
        )}
      </group>

      {board.type === 'main' && Object.entries(PIN_POSITIONS).map(([pinId, pin]) => {
        if (pin.zHeight !== board.centerZ) return null;
        
        const isEligible = eligiblePins.has(pinId);
        const pinX = fileToWorldX(pin.fileOffset + 1);
        const pinY = rankToWorldY(pin.rankOffset + 1);
        
        return (
          <mesh
            key={pinId}
            position={[pinX, pinY, board.centerZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[THEME.pinLocationDisk.radius, THEME.pinLocationDisk.radius, THEME.pinLocationDisk.thickness, 32]} />
            <meshStandardMaterial 
              color={isEligible ? THEME.squares.availableMoveColor : THEME.attackBoardSelector.color}
              transparent={!isEligible}
              opacity={isEligible ? 0.7 : 0.5}
            />
          </mesh>
        );
      })}

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
              } else {
                selectBoard(null);
              }
              selectSquare(square.id);
            }}
          >
            <boxGeometry args={[THEME.squares.size, THEME.squares.size, 0.1]} />
            <meshStandardMaterial
              color={
                isSelected ? THEME.squares.selectedColor :
                isLegalMove ? THEME.squares.availableMoveColor :
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
