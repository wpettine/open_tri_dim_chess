import React, { useState } from 'react';
import { useGameStore, type Move } from '../../store/gameStore';
import { LocalStoragePersistence } from '../../persistence/localStoragePersistence';
import SaveLoadManager from './SaveLoadManager';
import './MoveHistory.css';

export function MoveHistory() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerMode, setManagerMode] = useState<'save' | 'load'>('save');
  const moveHistory = useGameStore(state => state.moveHistory);
  const resetGame = useGameStore(state => state.resetGame);



  const handleImportFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = event.target?.result as string;
          await useGameStore.getState().importGameFromJson(json);
          alert('Imported and loaded save');
        } catch (err) {
          alert('Failed to import: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportGame = async () => {
    const persistence = new LocalStoragePersistence();
    const saves = await persistence.listSaves();
    if (saves.length === 0) {
      alert('No saved games to export');
      return;
    }
    let chosen = 0;
    if (saves.length > 1) {
      const list = saves.map((s, i) => `${i}: ${s.name} (${new Date(s.updatedAt).toLocaleString()})`).join('\n');
      const res = prompt(`Select save to export (index):\n${list}`, '0');
      if (res === null) return;
      const idx = parseInt(res, 10);
      if (Number.isNaN(idx) || idx < 0 || idx >= saves.length) {
        alert('Invalid selection'); return;
      }
      chosen = idx;
    }
    const id = saves[chosen].id;
    const json = await useGameStore.getState().exportGameById(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otdc-save-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        <button onClick={handleExportGame} className="game-button save">
          Export Save
        </button>
        <button onClick={handleImportFromFile} className="game-button load">
          Import from File
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
