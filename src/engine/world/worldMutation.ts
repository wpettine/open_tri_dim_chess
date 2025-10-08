import type { ChessWorld } from './types';
import type { Piece } from '../../store/gameStore';
import { PIN_POSITIONS } from './pinPositions';
import { ATTACK_BOARD_ADJACENCY } from './attackBoardAdjacency';

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
  const rotationCheck = validateRotation(context);
  if (!rotationCheck.isValid) return rotationCheck;

  if (context.fromPinId !== context.toPinId) {
    const adjacencyCheck = validateAdjacency(context);
    if (!adjacencyCheck.isValid) return adjacencyCheck;

    const occupancyCheck = validateOccupancy(context);
    if (!occupancyCheck.isValid) return occupancyCheck;

    const shadowCheck = validateVerticalShadow(context);
    if (!shadowCheck.isValid) return shadowCheck;
  }

  const kingSafetyCheck = validateKingSafety(context);
  if (!kingSafetyCheck.isValid) return kingSafetyCheck;

  return { isValid: true };
}

function validateRotation(context: BoardMoveContext): BoardMoveValidation {
  if (!context.rotate) {
    return { isValid: true };
  }

  const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
  if (passengerPieces.length > 1) {
    return { isValid: false, reason: 'Cannot rotate with more than 1 piece on board' };
  }

  return { isValid: true };
}

function getBoardColor(boardId: string): 'white' | 'black' {
  return boardId.startsWith('W') ? 'white' : 'black';
}

function getRelativeDirection(
  absoluteDirection: string[],
  boardColor: 'white' | 'black'
): string[] {
  if (boardColor === 'black') {
    return absoluteDirection.map(dir => {
      if (dir === 'forward') return 'backward';
      if (dir === 'backward') return 'forward';
      return dir; // 'side' stays the same
    });
  }
  return absoluteDirection;
}

function validateAdjacency(context: BoardMoveContext): BoardMoveValidation {
  const adjacencyList = ATTACK_BOARD_ADJACENCY[context.fromPinId];
  
  if (!adjacencyList) {
    return { isValid: false, reason: 'Invalid source pin' };
  }

  const edge = adjacencyList.find(e => e.to === context.toPinId);
  
  if (!edge) {
    return { isValid: false, reason: 'Destination pin is not adjacent' };
  }

  const boardColor = getBoardColor(context.boardId);
  const relativeDirection = getRelativeDirection(edge.dir, boardColor);
  
  const isBackwardForPlayer = relativeDirection.includes('backward');

  if (edge.requiresEmpty && isBackwardForPlayer) {
    const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
    if (passengerPieces.length > 0) {
      return { 
        isValid: false, 
        reason: 'Cannot move backward or backward+side while occupied' 
      };
    }
  }

  return { isValid: true };
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

function validateVerticalShadow(context: BoardMoveContext): BoardMoveValidation {
  const toPin = PIN_POSITIONS[context.toPinId];

  if (!toPin) {
    return { isValid: false, reason: 'Invalid destination pin' };
  }

  const destinationSquares = getBoardSquaresForBoardAtPin(context.boardId, context.toPinId);

  for (const square of destinationSquares) {
    const blockingPiece = context.pieces.find(p => 
      p.file === square.file &&
      p.rank === square.rank &&
      p.type !== 'knight' &&
      p.level !== context.boardId
    );
    
    if (blockingPiece) {
      const fileNames = ['z', 'a', 'b', 'c', 'd', 'e'];
      const fileName = fileNames[blockingPiece.file] || '?';
      return { 
        isValid: false, 
        reason: `Vertical shadow: ${blockingPiece.type} at ${fileName}${blockingPiece.rank}${blockingPiece.level} blocks board placement` 
      };
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
    const isOnThisBoard = piece.level === boardId;
    return isOnBoardSquare && isOnThisBoard;
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

  console.log('[executeBoardMove] Passenger count:', passengerPieces.length);
  console.log('[executeBoardMove] Passenger IDs:', passengerPieces.map(p => `${p.type}@${p.file},${p.rank},${p.level}`));

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

    console.log('[executeBoardMove] Remapping passenger:', {
      type: piece.type,
      from: `${piece.file},${piece.rank},${piece.level}`,
      to: `${newFile},${newRank},${piece.level}`,
    });

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
