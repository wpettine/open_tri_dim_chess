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
      <div className="game-status turn-indicator">
        <button
          className="undo-button"
          onClick={undoMove}
          disabled={!canUndo}
          aria-label="Undo last move"
          title="Undo last move"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7l5-5v3h6a7 7 0 110 14h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 5v4H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <p>Move: {currentTurn === 'white' ? 'White' : 'Black'}</p>
      </div>
    );
  }
  
  return null;
}
