import React from 'react';

export type ArrivalChoice = 'identity' | 'rot180';

export interface ArrivalOption {
  choice: ArrivalChoice;
  file: number;
  rank: number;
}

export function ArrivalOverlay({
  options,
  onConfirm,
  onCancel,
}: {
  options: ArrivalOption[];
  onConfirm: (choice: ArrivalChoice) => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 8,
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      borderRadius: 6,
      fontFamily: 'sans-serif',
      zIndex: 1000,
    }}>
      <div style={{ marginBottom: 6, fontWeight: 600 }}>Choose Arrival</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt.choice}
            onClick={() => onConfirm(opt.choice)}
            style={{
              padding: '6px 10px',
              background: '#2d8cff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            {opt.choice === 'identity' ? 'Identity' : 'Rotate 180°'}
          </button>
        ))}
        <button
          onClick={onCancel}
          style={{
            padding: '6px 10px',
            background: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ArrivalOverlay;
