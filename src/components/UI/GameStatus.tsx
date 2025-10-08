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
            ↶
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
