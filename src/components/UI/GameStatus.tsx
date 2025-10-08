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

  return (
    <>
      {!gameOver && (
        <div className="game-status turn-indicator">
          <button
            className="undo-button"
            onClick={undoMove}
            disabled={!canUndo}
            aria-label="Undo last move"
            title="Undo last move"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M10.5 4.5v3L6.75 3.75 3 1.5v9l3.75-2.25L10.5 6v3c5.25 0 8.25 2.25 8.25 6 0 1.2-.36 2.28-1.02 3.21-.27.38-.81.45-1.19.18-.38-.27-.45-.81-.18-1.19.48-.69.64-1.38.64-2.2 0-2.85-2.46-4.5-6.5-4.5z" fill="currentColor"/>
            </svg>
          </button>
          <p>Move: {currentTurn === 'white' ? 'White' : 'Black'}</p>
        </div>
      )}

      {isCheckmate && (
        <div className="game-status checkmate">
          <h2>Checkmate!</h2>
          <p>{currentTurn === 'white' ? 'Black' : 'White'} wins!</p>
        </div>
      )}

      {isStalemate && (
        <div className="game-status stalemate">
          <h2>Stalemate!</h2>
          <p>Game is a draw</p>
        </div>
      )}

      {isCheck && !isCheckmate && !isStalemate && (
        <div className="game-status check">
          <p>{currentTurn === 'white' ? 'White' : 'Black'} is in check!</p>
        </div>
      )}
    </>
  );
}
export default GameStatus;
