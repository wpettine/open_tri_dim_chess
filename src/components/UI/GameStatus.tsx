import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './GameStatus.css';

export function GameStatus() {
  const isCheck = useGameStore(state => state.isCheck);
  const isCheckmate = useGameStore(state => state.isCheckmate);
  const isStalemate = useGameStore(state => state.isStalemate);
  const currentTurn = useGameStore(state => state.currentTurn);
  const gameOver = useGameStore(state => state.gameOver);
  const undoMove = useGameStore(state => state.undoMove);
  const canUndo = useGameStore(state => state.moveHistory.length > 0);
  
  if (isCheckmate) {
    const winner = currentTurn === 'white' ? 'Black' : 'White';
    return (
      <div className="game-status checkmate">
        <h2>Checkmate!</h2>
        <p>{winner} wins!</p>
      </div>
    );
  }
  
  if (isStalemate) {
    return (
      <div className="game-status stalemate">
        <h2>Stalemate!</h2>
        <p>Game is a draw</p>
      </div>
    );
  }
  
  if (isCheck) {
    return (
      <div className="game-status check">
        <p>{currentTurn === 'white' ? 'White' : 'Black'} is in check!</p>
      </div>
    );
  }
  
  if (!gameOver) {
    return (
      <div
        className="game-status turn-indicator"
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.9)',
          pointerEvents: 'auto',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          className="undo-button"
          onClick={undoMove}
          disabled={!canUndo}
          aria-label="Undo last move"
          title="Undo last move"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 5v3.586l1.293-1.293 1.414 1.414L11 12l-3.707-3.293 1.414-1.414L10 8.586V5h2zm-4 9a6 6 0 1112 0 6 6 0 01-12 0zm-2 0c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8a7.963 7.963 0 00-5.657 2.343L6 6v4h4l-1.757-1.757A5.966 5.966 0 0114 8a6 6 0 100 12 6 6 0 01-8-6z"/>
          </svg>
        </button>
        <p>Move: {currentTurn === 'white' ? 'White' : 'Black'}</p>
      </div>
    );
  }
  
  return null;
}
