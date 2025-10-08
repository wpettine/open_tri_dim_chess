import React from 'react';

import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PIN_POSITIONS } from '../../engine/world/pinPositions';

export function RailPins() {
  const selectedBoardId = useGameStore(s => s.selectedBoardId);
  const canMoveBoard = useGameStore(s => s.canMoveBoard);
  const moveAttackBoard = useGameStore(s => s.moveAttackBoard);

  const pins = useMemo(() => Object.keys(PIN_POSITIONS) as Array<keyof typeof PIN_POSITIONS>, []);

  if (!selectedBoardId) return null;

  return (
    <div style={containerStyle}>
      {pins.map((id) => {
        const res = canMoveBoard(selectedBoardId, id);
        return (
          <button
            key={id}
            onClick={res.allowed ? () => moveAttackBoard(selectedBoardId, id) : undefined}
            aria-disabled={!res.allowed}
            style={{...pinStyle, ...(res.allowed ? eligibleStyle : disabledStyle)}}
            title={res.allowed ? undefined : res.reason}
          >
            {id}
          </button>
        );
      })}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  right: 12,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  zIndex: 10,
  pointerEvents: 'auto',
};

const pinStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #5a5a7a',
  background: 'rgba(30,30,55,0.6)',
  color: '#e9f0ff',
  cursor: 'pointer',
};

const eligibleStyle: React.CSSProperties = {
  borderColor: '#66ff99',
  boxShadow: '0 0 6px #66ff99',
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
};
