import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getCastlingOptions, type CastleType } from '../../engine/validation/castleValidator';
import './CastleControls.css';

/**
 * UI component for castling controls
 * Shows available castling options for the current player
 * Only appears when castling is legal
 */
export function CastleControls() {
  const currentTurn = useGameStore(state => state.currentTurn);
  const pieces = useGameStore(state => state.pieces);
  const world = useGameStore(state => state.world);
  const trackStates = useGameStore(state => state.trackStates);
  const attackBoardActivatedThisTurn = useGameStore(state => state.attackBoardActivatedThisTurn);
  const attackBoardStates = useGameStore(state => state.attackBoardStates);
  const executeCastle = useGameStore(state => state.executeCastle);

  const [hoveredCastle, setHoveredCastle] = useState<CastleType | null>(null);

  // Get available castling options
  const options = getCastlingOptions(
    currentTurn,
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
    attackBoardStates
  );

  // Debug logging
  console.log('[CastleControls] Options:', options);
  console.log('[CastleControls] Current turn:', currentTurn);
  console.log('[CastleControls] Track states:', trackStates);
  console.log('[CastleControls] Attack board states:', attackBoardStates);
  const kingsAndRooks = pieces.filter(p => p.type === 'king' || p.type === 'rook');
  console.log('[CastleControls] Kings and Rooks:', kingsAndRooks.map(p => ({
    type: p.type,
    color: p.color,
    level: p.level,
    file: p.file,
    rank: p.rank,
    hasMoved: p.hasMoved
  })));

  // Don't render if no castling options available
  if (options.length === 0) {
    console.log('[CastleControls] No castling options available, not rendering');
    return null;
  }

  const handleCastle = (castleType: CastleType) => {
    executeCastle(castleType);
    setHoveredCastle(null);
  };

  const getCastleLabel = (castleType: CastleType): string => {
    switch (castleType) {
      case 'kingside-ql':
        return 'Castle Kingside (QL)';
      case 'kingside-kl':
        return 'Castle Kingside (KL)';
      case 'queenside':
        return 'Castle Queenside';
    }
  };

  const getCastleNotation = (castleType: CastleType): string => {
    return castleType === 'queenside' ? 'O-O-O' : 'O-O';
  };

  const getCastleDescription = (castleType: CastleType): string => {
    switch (castleType) {
      case 'kingside-ql':
        return 'King and rook swap positions on Queen\'s Line board';
      case 'kingside-kl':
        return 'King and rook swap positions on King\'s Line board';
      case 'queenside':
        return 'King and rook swap between QL and KL boards';
    }
  };

  return (
    <div className="castle-controls">
      <div className="castle-header">
        <h3>Castling Available</h3>
        <p className="castle-subtitle">
          {currentTurn === 'white' ? 'White' : 'Black'} to move
        </p>
      </div>

      <div className="castle-options">
        {options.includes('kingside-ql') && (
          <button
            className={`castle-button ${hoveredCastle === 'kingside-ql' ? 'hovered' : ''}`}
            onClick={() => handleCastle('kingside-ql')}
            onMouseEnter={() => setHoveredCastle('kingside-ql')}
            onMouseLeave={() => setHoveredCastle(null)}
            title={getCastleDescription('kingside-ql')}
          >
            <span className="castle-label">{getCastleLabel('kingside-ql')}</span>
            <span className="castle-notation">{getCastleNotation('kingside-ql')}</span>
          </button>
        )}

        {options.includes('kingside-kl') && (
          <button
            className={`castle-button ${hoveredCastle === 'kingside-kl' ? 'hovered' : ''}`}
            onClick={() => handleCastle('kingside-kl')}
            onMouseEnter={() => setHoveredCastle('kingside-kl')}
            onMouseLeave={() => setHoveredCastle(null)}
            title={getCastleDescription('kingside-kl')}
          >
            <span className="castle-label">{getCastleLabel('kingside-kl')}</span>
            <span className="castle-notation">{getCastleNotation('kingside-kl')}</span>
          </button>
        )}

        {options.includes('queenside') && (
          <button
            className={`castle-button ${hoveredCastle === 'queenside' ? 'hovered' : ''}`}
            onClick={() => handleCastle('queenside')}
            onMouseEnter={() => setHoveredCastle('queenside')}
            onMouseLeave={() => setHoveredCastle(null)}
            title={getCastleDescription('queenside')}
          >
            <span className="castle-label">{getCastleLabel('queenside')}</span>
            <span className="castle-notation">{getCastleNotation('queenside')}</span>
          </button>
        )}
      </div>

      <div className="castle-info">
        <p className="castle-hint">
          Hover over a button to see details
        </p>
      </div>
    </div>
  );
}
