import React, { useState } from 'react';
import { useGameStore, type Move } from '../../store/gameStore';
import SaveLoadManager from './SaveLoadManager';
import './MoveHistory.css';

export function MoveHistory() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerMode, setManagerMode] = useState<'save' | 'load'>('save');
  const moveHistory = useGameStore(state => state.moveHistory);
  const resetGame = useGameStore(state => state.resetGame);





  const handleNewGame = () => {
    if (moveHistory.length > 0) {
      const confirmed = confirm('Start a new game? Current game will be lost.');
      if (!confirmed) return;
    }
    
    resetGame();
  };

  return (
    <div className="move-history-panel" data-mh-len={moveHistory.length}>
      <div className="game-controls">
        <button onClick={handleNewGame} className="game-button new">
          New Game
        </button>
        <button onClick={() => { setManagerMode('save'); setManagerOpen(true); }} className="game-button save">
          Save Game
        </button>
        <button onClick={() => { setManagerMode('load'); setManagerOpen(true); }} className="game-button load">
          Load Game
        </button>
      </div>

      <div 
        className="move-history-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3>Move History</h3>
        <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
      </div>
      
      {!isCollapsed && (
        <div className="move-history-list">
          {moveHistory.length === 0 ? (
            <p className="no-moves">No moves yet</p>
          ) : (
            moveHistory.map((move, idx) => (
              <MoveEntry key={idx} move={move} number={idx + 1} />
            ))
          )}
        </div>
      )}

      <SaveLoadManager
        open={managerOpen}
        mode={managerMode}
        onClose={() => setManagerOpen(false)}
      />
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
