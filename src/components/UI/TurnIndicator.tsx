import { useGameStore } from '../../store/gameStore';

/**
 * Displays the current turn and game status
 */
export function TurnIndicator() {
  const currentTurn = useGameStore((state) => state.currentTurn);
  const pieces = useGameStore((state) => state.pieces);
  const moveHistory = useGameStore((state) => state.moveHistory);

  const whitePieces = pieces.filter(p => p.color === 'white').length;
  const blackPieces = pieces.filter(p => p.color === 'black').length;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
        Tri-D Chess
      </h2>

      <div style={{ fontSize: '18px', marginBottom: '15px' }}>
        <strong>Turn:</strong>{' '}
        <span style={{
          color: currentTurn === 'white' ? '#f5f5dc' : '#888',
          fontWeight: 'bold'
        }}>
          {currentTurn.toUpperCase()}
        </span>
      </div>

      <div style={{ fontSize: '14px', opacity: 0.8 }}>
        <div style={{ marginBottom: '5px' }}>
          ♔ White pieces: {whitePieces}
        </div>
        <div style={{ marginBottom: '5px' }}>
          ♚ Black pieces: {blackPieces}
        </div>
        <div>
          Moves: {moveHistory.length}
        </div>
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        opacity: 0.6,
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: '10px'
      }}>
        Click a piece to select it.<br/>
        Valid moves will be highlighted in green.
      </div>
    </div>
  );
}
