import type { ChessWorld } from './types';
import type { Piece } from '../../store/gameStore';
import { PIN_POSITIONS } from './pinPositions';

export interface BoardMoveContext {
  boardId: string;
  fromPinId: string;
  toPinId: string;
  rotate: boolean;
  pieces: Piece[];
  world: ChessWorld;
  attackBoardPositions: Record<string, string>;
}

export interface BoardMoveValidation {
  isValid: boolean;
  reason?: string;
}

export function validateBoardMove(context: BoardMoveContext): BoardMoveValidation {
  const adjacencyCheck = validateAdjacency(context);
  if (!adjacencyCheck.isValid) return adjacencyCheck;

  const occupancyCheck = validateOccupancy(context);
  if (!occupancyCheck.isValid) return occupancyCheck;

  const directionCheck = validateDirection(context);
  if (!directionCheck.isValid) return directionCheck;

  const shadowCheck = validateVerticalShadow(context);
  if (!shadowCheck.isValid) return shadowCheck;

  const kingSafetyCheck = validateKingSafety(context);
  if (!kingSafetyCheck.isValid) return kingSafetyCheck;

  return { isValid: true };
}

function validateAdjacency(context: BoardMoveContext): BoardMoveValidation {
  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];
  
  if (!fromPin || !toPin) {
    return { isValid: false, reason: 'Invalid source or destination pin' };
  }

  const fromLine = context.fromPinId.startsWith('QL') ? 'QL' : 'KL';
  const toLine = context.toPinId.startsWith('QL') ? 'QL' : 'KL';

  if (fromLine === toLine) {
    const levelDiff = Math.abs(toPin.level - fromPin.level);
    
    if (levelDiff <= 2) {
      return { isValid: true };
    }
    
    const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
    const hasKnight = passengerPieces.some(p => p.type === 'knight');
    
    if (levelDiff <= 3 && hasKnight) {
      return { isValid: true };
    }
    
    return { isValid: false, reason: 'Destination pin is not adjacent' };
  }

  if (fromPin.adjacentPins.includes(context.toPinId)) {
    return { isValid: true };
  }

  return { isValid: false, reason: 'Destination pin is not adjacent' };
}

function validateOccupancy(context: BoardMoveContext): BoardMoveValidation {
  const destinationOccupied = Object.entries(context.attackBoardPositions).some(
    ([boardId, pinId]) => boardId !== context.boardId && pinId === context.toPinId
  );

  if (destinationOccupied) {
    return { isValid: false, reason: 'Destination pin is occupied by another attack board' };
  }

  return { isValid: true };
}

function validateDirection(context: BoardMoveContext): BoardMoveValidation {
  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];

  if (!fromPin || !toPin) {
    return { isValid: false, reason: 'Invalid pin positions' };
  }

  const levelDiff = toPin.level - fromPin.level;
  
  if (levelDiff > 0) {
    return { isValid: true };
  }
  
  if (levelDiff === 0) {
    const fromLine = context.fromPinId.startsWith('QL') ? 'QL' : 'KL';
    const toLine = context.toPinId.startsWith('QL') ? 'QL' : 'KL';
    
    if (fromLine !== toLine) {
      return { isValid: true };
    }
    
    return { isValid: false, reason: 'Cannot move sideways within the same line' };
  }
  
  if (fromPin.inverted) {
    return { isValid: true };
  }
  
  return { isValid: false, reason: 'Cannot move backward (except from inverted pins)' };
}

function validateVerticalShadow(context: BoardMoveContext): BoardMoveValidation {
  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];

  if (!fromPin || !toPin) {
    return { isValid: false, reason: 'Invalid pin positions' };
  }

  const levelDiff = Math.abs(toPin.level - fromPin.level);
  if (levelDiff <= 1) {
    return { isValid: true };
  }

  const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
  const hasKnight = passengerPieces.some(p => p.type === 'knight');

  if (levelDiff > 2 && !hasKnight) {
    return { 
      isValid: false, 
      reason: 'Cannot move more than 2 levels without a knight passenger' 
    };
  }

  const minLevel = Math.min(fromPin.level, toPin.level);
  const maxLevel = Math.max(fromPin.level, toPin.level);
  
  if (hasKnight) {
    return { isValid: true };
  }

  const boardSquares = getBoardSquaresForBoardAtPin(context.boardId, context.fromPinId);
  
  for (let level = minLevel + 1; level < maxLevel; level++) {
    for (const square of boardSquares) {
      const blockingPiece = context.pieces.find(p => 
        p.file === square.file &&
        p.rank === square.rank &&
        parseInt(p.level) === level &&
        !passengerPieces.includes(p)
      );
      
      if (blockingPiece) {
        return { 
          isValid: false, 
          reason: `Vertical shadow blocked by ${blockingPiece.type} at level ${level}` 
        };
      }
    }
  }

  return { isValid: true };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateKingSafety(_context: BoardMoveContext): BoardMoveValidation {
  return { isValid: true };
}

function getPassengerPieces(
  boardId: string,
  pinId: string,
  pieces: Piece[]
): Piece[] {
  const pin = PIN_POSITIONS[pinId];
  if (!pin) return [];
  
  const boardSquares = getBoardSquaresForBoardAtPin(boardId, pinId);
  
  return pieces.filter(piece => {
    const pieceSquareId = `${piece.file}-${piece.rank}`;
    const isOnBoardSquare = boardSquares.some(sq => `${sq.file}-${sq.rank}` === pieceSquareId);
    const isAtBoardLevel = parseInt(piece.level) === pin.level;
    return isOnBoardSquare && isAtBoardLevel;
  });
}

function getBoardSquaresForBoardAtPin(
  boardId: string,
  pinId: string
): Array<{ file: number; rank: number }> {
  const pin = PIN_POSITIONS[pinId];
  if (!pin) return [];

  const isQueenLine = pinId.startsWith('QL');
  const baseFile = isQueenLine ? 0 : 4;
  
  return [
    { file: baseFile, rank: pin.rankOffset },
    { file: baseFile + 1, rank: pin.rankOffset },
    { file: baseFile, rank: pin.rankOffset + 1 },
    { file: baseFile + 1, rank: pin.rankOffset + 1 },
  ];
}

export interface BoardMoveResult {
  updatedPieces: Piece[];
  updatedPositions: Record<string, string>;
}

export function executeBoardMove(context: BoardMoveContext): BoardMoveResult {
  const updatedPositions = {
    ...context.attackBoardPositions,
    [context.boardId]: context.toPinId,
  };

  const passengerPieces = getPassengerPieces(
    context.boardId,
    context.fromPinId,
    context.pieces
  );

  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];
  
  const fileOffset = toPin.fileOffset - fromPin.fileOffset;
  const rankOffset = toPin.rankOffset - fromPin.rankOffset;

  const updatedPieces = context.pieces.map(piece => {
    const isPassenger = passengerPieces.includes(piece);
    
    if (!isPassenger) {
      return piece;
    }

    let newFile = piece.file + fileOffset;
    let newRank = piece.rank + rankOffset;

    if (context.rotate) {
      const relativeFile = piece.file - fromPin.fileOffset;
      const relativeRank = piece.rank - fromPin.rankOffset;
      
      newFile = toPin.fileOffset + (1 - relativeFile);
      newRank = toPin.rankOffset + (1 - relativeRank);
    }

    return {
      ...piece,
      file: newFile,
      rank: newRank,
      hasMoved: true,
    };
  });

  return {
    updatedPieces,
    updatedPositions,
  };
}
