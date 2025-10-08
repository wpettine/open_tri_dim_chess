import React from 'react';

import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const BOARDS = ['WQL', 'WKL', 'BQL', 'BKL'] as const;
const PINS = ['QL1','QL2','QL3','QL4','QL5','QL6','KL1','KL2','KL3','KL4','KL5','KL6'] as const;

export function AttackBoardControls() {
  const selectedBoardId = useGameStore(s => s.selectedBoardId);
  const selectBoard = useGameStore(s => s.selectBoard);
  const canMoveBoard = useGameStore(s => s.canMoveBoard);
  const moveAttackBoard = useGameStore(s => s.moveAttackBoard);
  const canRotate = useGameStore(s => s.canRotate);
  const rotateAttackBoard = useGameStore(s => s.rotateAttackBoard);
  const positions = useGameStore(s => s.attackBoardPositions);

  const [hoverRotate, setHoverRotate] = useState<0|180|null>(null);

  const eligiblePins = useMemo(() => {
    if (!selectedBoardId) return new Set<string>();
    const set = new Set<string>();
    for (const pin of PINS) {
      const res = canMoveBoard(selectedBoardId, pin);
      if (res.allowed) set.add(pin);
    }
    return set;
  }, [selectedBoardId, canMoveBoard, positions]);

  const disabledRotateReason = useMemo(() => {
    if (!selectedBoardId) return undefined;
    const res = canRotate(selectedBoardId, 180);
    return res.allowed ? undefined : res.reason || 'Rotation not allowed';
  }, [selectedBoardId, canRotate, positions]);

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        {BOARDS.map(id => (
          <button
            key={id}
            aria-pressed={selectedBoardId === id}
            onClick={() => selectBoard(id)}
            style={{
              ...pillStyle,
              ...(selectedBoardId === id ? pillActive : {}),
            }}
          >
            {id}
          </button>
        ))}
        <button onClick={() => selectBoard(null)} style={pillStyle}>Clear</button>
      </div>

      {selectedBoardId && (
        <>
          <div style={rowStyle}>
            {PINS.map(pin => {
              const eligible = eligiblePins.has(pin);
              const result = canMoveBoard(selectedBoardId, pin);
              const onClick = eligible ? () => moveAttackBoard(selectedBoardId, pin) : undefined;
              return (
                <button
                  key={pin}
                  onClick={onClick}
                  aria-disabled={!eligible}
                  style={{...pinStyle, ...(eligible ? pinEligible : pinDisabled)}}
                  title={!eligible ? result.reason || 'Illegal destination' : undefined}
                >
                  {pin}
                </button>
              );
            })}
          </div>

          <div style={rowStyle}>
            <span>Rotation:</span>
            <button
              style={{...pillStyle, ...(hoverRotate===0 ? pillActive : {})}}
              onMouseEnter={() => setHoverRotate(0)}
              onMouseLeave={() => setHoverRotate(null)}
              onClick={() => rotateAttackBoard(selectedBoardId, 0)}
              aria-label="Rotate 0 degrees"
            >
              0°
            </button>
            <button
              style={{...pillStyle, ...(hoverRotate===180 ? pillActive : {}), ...(disabledRotateReason ? pillDisabled : {})}}
              onMouseEnter={() => setHoverRotate(180)}
              onMouseLeave={() => setHoverRotate(null)}
              onClick={() => !disabledRotateReason && rotateAttackBoard(selectedBoardId, 180)}
              aria-label="Rotate 180 degrees"
              title={disabledRotateReason}
              aria-disabled={!!disabledRotateReason}
            >
              180°
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: 12,
  right: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 10,
  pointerEvents: 'auto',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const pillStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid #6a6a9a',
  background: 'rgba(40,40,70,0.6)',
  color: '#d5e7ff',
  cursor: 'pointer',
};

const pillActive: React.CSSProperties = {
  borderColor: '#33b5ff',
  boxShadow: '0 0 8px #33b5ff',
};

const pillDisabled: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const pinStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #5a5a7a',
  background: 'rgba(30,30,55,0.6)',
  color: '#e9f0ff',
  cursor: 'pointer',
  minWidth: 52,
  textAlign: 'center',
};

const pinEligible: React.CSSProperties = {
  borderColor: '#66ff99',
  boxShadow: '0 0 6px #66ff99',
};

const pinDisabled: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
};
