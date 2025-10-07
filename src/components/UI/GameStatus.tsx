import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './GameStatus.css';

export function GameStatus() {
  const isCheck = useGameStore(state => state.isCheck);
  const isCheckmate = useGameStore(state => state.isCheckmate);
  const isStalemate = useGameStore(state => state.isStalemate);
  const currentTurn = useGameStore(state => state.currentTurn);
  const gameOver = useGameStore(state => state.gameOver);
  
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
        <p>Current turn: {currentTurn === 'white' ? 'White' : 'Black'}</p>
      </div>
    );
  }
  
  return null;
}
