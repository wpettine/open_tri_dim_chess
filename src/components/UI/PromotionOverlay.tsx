import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import './PromotionOverlay.css';

export type PieceType = 'queen' | 'rook' | 'bishop' | 'knight';

export interface PromotionChoice {
  type: PieceType;
  label: string;
  symbol: string;
  key: string;
}

const PROMOTION_CHOICES: PromotionChoice[] = [
  { type: 'queen', label: 'Queen', symbol: '♕', key: 'Q' },
  { type: 'rook', label: 'Rook', symbol: '♖', key: 'R' },
  { type: 'bishop', label: 'Bishop', symbol: '♗', key: 'B' },
  { type: 'knight', label: 'Knight', symbol: '♘', key: 'N' },
];

export function PromotionOverlay() {
  const promotionPending = useGameStore(state => state.promotionPending);
  const executePromotion = useGameStore(state => state.executePromotion);
  const pieces = useGameStore(state => state.pieces);

  useEffect(() => {
    if (!promotionPending) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const choice = PROMOTION_CHOICES.find(c => c.key === key);
      if (choice) {
        executePromotion(choice.type);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [promotionPending, executePromotion]);

  if (!promotionPending) return null;

  const piece = pieces.find(p => p.id === promotionPending.pieceId);
  const pieceColor = piece?.color || 'white';
  const isForced = promotionPending.isForced;

  return (
    <div className="promotion-overlay-backdrop">
      <div className={`promotion-overlay ${isForced ? 'forced' : ''}`}>
        <div className="promotion-header">
          {isForced ? (
            <>
              <h2>⚠️ Forced Promotion!</h2>
              <p>Your pawn must promote before continuing</p>
            </>
          ) : (
            <>
              <h2>Pawn Promotion</h2>
              <p>Choose your piece:</p>
            </>
          )}
        </div>

        <div className="promotion-choices">
          {PROMOTION_CHOICES.map(choice => (
            <button
              key={choice.type}
              className={`promotion-button ${pieceColor}`}
              onClick={() => executePromotion(choice.type)}
              aria-label={`Promote to ${choice.label}`}
              title={`${choice.label} (${choice.key})`}
            >
              <div className="promotion-symbol">{choice.symbol}</div>
              <div className="promotion-label">{choice.label}</div>
              <div className="promotion-key">{choice.key}</div>
            </button>
          ))}
        </div>

        <div className="promotion-hint">
          Press Q, R, B, or N on your keyboard
        </div>
      </div>
    </div>
  );
}

export default PromotionOverlay;
