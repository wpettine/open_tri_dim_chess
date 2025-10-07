import React, { useState } from 'react';
import { useGameStore, type Move } from '../../store/gameStore';
import './MoveHistory.css';

export function MoveHistory() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const moveHistory = useGameStore(state => state.moveHistory);
  const resetGame = useGameStore(state => state.resetGame);

  const handleSaveGame = () => {
    const gameState = {
      pieces: useGameStore.getState().pieces,
      attackBoardPositions: useGameStore.getState().attackBoardPositions,
      currentTurn: useGameStore.getState().currentTurn,
      moveHistory: useGameStore.getState().moveHistory,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(gameState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const handleLoadGame = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const gameState = JSON.parse(event.target?.result as string);
          
          useGameStore.setState({
            pieces: gameState.pieces,
            attackBoardPositions: gameState.attackBoardPositions,
            currentTurn: gameState.currentTurn,
            moveHistory: gameState.moveHistory,
          });
        } catch {
          alert('Failed to load game: Invalid file format');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleNewGame = () => {
    if (moveHistory.length > 0) {
      const confirmed = confirm('Start a new game? Current game will be lost.');
      if (!confirmed) return;
    }
    
    resetGame();
  };

  return (
    <div className="move-history-panel">
      <div 
        className="move-history-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3>Move History</h3>
        <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="game-controls">
            <button onClick={handleNewGame} className="game-button new">
              New Game
            </button>
            <button onClick={handleSaveGame} className="game-button save">
              Save Game
            </button>
            <button onClick={handleLoadGame} className="game-button load">
              Load Game
            </button>
          </div>

          <div className="move-history-list">
            {moveHistory.length === 0 ? (
              <p className="no-moves">No moves yet</p>
            ) : (
              moveHistory.map((move, idx) => (
                <MoveEntry key={idx} move={move} number={idx + 1} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface MoveEntryProps {
  move: Move;
  number: number;
}

function MoveEntry({ move, number }: MoveEntryProps) {
  const isBoardMove = move.type === 'board-move';
  const colorClass = isBoardMove 
    ? `board-${move.boardId.startsWith('W') ? 'white' : 'black'}`
    : move.piece.color;

  return (
    <div className={`move-entry ${colorClass}`}>
      <span className="move-number">{number}.</span>
      <span className="move-notation">
        {isBoardMove 
          ? `${move.boardId}: ${move.from}-${move.to}${move.rotation === 180 ? '^180' : ''}`
          : `${move.from}-${move.to}`
        }
      </span>
    </div>
  );
}
