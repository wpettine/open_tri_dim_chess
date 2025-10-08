import { useGameStore } from '../../store/gameStore';
import { getBoardController, getPiecesOnBoard } from '../../engine/attackBoards/occupancy';
import { PieceState } from '../../engine/movement/types';
import { createSquareId } from '../../engine/world/coordinates';

/**
 * UI component for controlling attack boards
 * Shows board status and provides movement controls
 */
export function AttackBoardControls() {
  const currentTurn = useGameStore((state) => state.currentTurn);
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);
  const attackBoardPositions = useGameStore((state) => state.attackBoardPositions);
  const selectedBoardId = useGameStore((state) => state.selectedBoardId);
  const selectBoard = useGameStore((state) => state.selectBoard);

  const pieceToPieceState = (piece: any): PieceState => ({
    id: piece.id,
    type: piece.type,
    color: piece.color,
    squareId: createSquareId(piece.file, piece.rank, piece.level),
    hasMoved: piece.hasMoved,
    movedAsPassenger: piece.movedAsPassenger,
  });

  const pieceStates = pieces.map(pieceToPieceState);

  const attackBoards = [
    { id: 'WQL', name: 'White QL', owner: 'white' as const },
    { id: 'WKL', name: 'White KL', owner: 'white' as const },
    { id: 'BQL', name: 'Black QL', owner: 'black' as const },
    { id: 'BKL', name: 'Black KL', owner: 'black' as const },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '10px',
        minWidth: '250px',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Attack Boards</h3>

      {attackBoards.map(({ id, name, owner }) => {
        const pinId = attackBoardPositions[id as keyof typeof attackBoardPositions];
        const controller = getBoardController(id, pieceStates, world, owner);
        const boardPieces = getPiecesOnBoard(id, pieceStates, world);
        const isSelected = selectedBoardId === id;
        const canControl = controller === currentTurn;

        return (
          <div
            key={id}
            onClick={() => canControl && selectBoard(id)}
            style={{
              padding: '8px',
              marginBottom: '5px',
              backgroundColor: isSelected
                ? 'rgba(255, 215, 0, 0.3)'
                : canControl
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '5px',
              cursor: canControl ? 'pointer' : 'default',
              border: isSelected ? '2px solid gold' : '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{name}</div>
            <div style={{ fontSize: '11px', marginTop: '3px' }}>
              Pin: {pinId} | Pieces: {boardPieces.length}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              Controller:{' '}
              <span
                style={{
                  color: controller === 'white' ? '#f5f5dc' : controller === 'black' ? '#888' : '#ff6666',
                  fontWeight: 'bold',
                }}
              >
                {controller ? controller.toUpperCase() : 'CONTESTED'}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#aaa' }}>
        {selectedBoardId ? (
          <div>Click a highlighted pin to move the selected board</div>
        ) : (
          <div>Click a board you control to see valid moves</div>
        )}
      </div>
    </div>
  );
}
