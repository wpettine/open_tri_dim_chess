import { makeInstanceId } from './attackBoardAdjacency';
import { translatePassenger, rotatePassenger180, type ArrivalChoice } from './coordinatesTransform';

import type { ChessWorld } from './types';
import type { Piece } from '../../store/gameStore';
import { PIN_POSITIONS } from './pinPositions';
import { getPinLevel } from './attackBoardAdjacency';
import { ATTACK_BOARD_ADJACENCY, classifyDirection } from './attackBoardAdjacency';

export interface BoardMoveContext {
  boardId: string;
  fromPinId: string;
  toPinId: string;
  rotate: boolean;
  pieces: Piece[];
  world: ChessWorld;
  attackBoardPositions: Record<string, string>;
  arrivalChoice?: ArrivalChoice;
}

export interface BoardMoveValidation {
  isValid: boolean;
  reason?: string;
}
export interface ActivationContext {
  boardId: string;
  fromPinId: string;
  toPinId: string;
  rotate: boolean;
  pieces: Piece[];
  world: ChessWorld;
  attackBoardPositions: Record<string, string>;
  arrivalChoice?: ArrivalChoice;
}

export interface ActivationResult {
  updatedPieces: Piece[];
  updatedPositions: Record<string, string>;
  activeInstanceId: string;
}

export function validateActivation(context: ActivationContext): BoardMoveValidation {
  return validateBoardMove({
    boardId: context.boardId,
    fromPinId: context.fromPinId,
    toPinId: context.toPinId,
    rotate: context.rotate,
    pieces: context.pieces,
    world: context.world,
    attackBoardPositions: context.attackBoardPositions,
  });
}

export function executeActivation(context: ActivationContext): ActivationResult {
  console.log('[executeActivation] START', {
    boardId: context.boardId,
    fromPinId: context.fromPinId,
    toPinId: context.toPinId,
    rotate: context.rotate,
    arrivalChoice: context.arrivalChoice,
  });

  const base = executeBoardMove({
    boardId: context.boardId,
    fromPinId: context.fromPinId,
    toPinId: context.toPinId,
    rotate: context.rotate,
    pieces: context.pieces,
    world: context.world,
    attackBoardPositions: context.attackBoardPositions,
    arrivalChoice: context.arrivalChoice,
  });

  console.log('[executeActivation] executeBoardMove returned:', {
    updatedPiecesCount: base.updatedPieces.length,
    updatedPositions: base.updatedPositions,
  });

  // Log each remapped piece
  const passengers = base.updatedPieces.filter(p => p.level === context.boardId);
  console.log('[executeActivation] Remapped passengers:', passengers.map(p => ({
    type: p.type,
    color: p.color,
    level: p.level,
    file: p.file,
    rank: p.rank,
    squareId: `${['z','a','b','c','d','e'][p.file]}${p.rank}${p.level}`,
  })));

  const rotation: 0 | 180 = (context.rotate || (context.world.boards.get(context.boardId)?.rotation === 180))
    ? 180
    : 0;
  // Use destination pin's track for cross-track moves
  const track = context.toPinId.startsWith('QL') ? 'QL' : 'KL';
  const pinNum = Number(context.toPinId.slice(2));
  const activeInstanceId = makeInstanceId(track as 'QL' | 'KL', pinNum, rotation);

  console.log('[executeActivation] Computed activeInstanceId:', {
    track,
    pinNum,
    rotation,
    activeInstanceId,
  });
  console.log('[executeActivation] END');

  return {
    updatedPieces: base.updatedPieces,
    updatedPositions: base.updatedPositions,
    activeInstanceId,
  };
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

function getBoardOwner(boardId: string): 'white' | 'black' {
  return boardId.startsWith('W') ? 'white' : 'black';
}

function getBoardController(
  boardId: string,
  fromPinId: string,
  pieces: Piece[]
): 'white' | 'black' {
  const passengerPieces = getPassengerPieces(boardId, fromPinId, pieces);
  
  if (passengerPieces.length > 0) {
    return passengerPieces[0].color;
  }
  
  return getBoardOwner(boardId);
}

function validateAdjacency(context: BoardMoveContext): BoardMoveValidation {
  const adjacencyList = ATTACK_BOARD_ADJACENCY[context.fromPinId];

  if (!adjacencyList) {
    return { isValid: false, reason: 'Invalid source pin' };
  }

  const isExplicitlyAdjacent = adjacencyList.includes(context.toPinId);

  // Check if this is a valid "forward to next main board level" move
  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];
  const controller = getBoardController(context.boardId, context.fromPinId, context.pieces);

  let isForwardToNextLevel = false;
  if (!isExplicitlyAdjacent && fromPin && toPin) {
    // Same track (QL→QL or KL→KL)
    const sameTrack = context.fromPinId.startsWith('QL') === context.toPinId.startsWith('QL');

    if (sameTrack) {
      // Check if moving to next main board level
      const fromZ = fromPin.zHeight;
      const toZ = toPin.zHeight;
      const direction = classifyDirection(context.fromPinId, context.toPinId, controller);

      // Must be forward and to a different main board level
      if (direction === 'forward' && fromZ !== toZ) {
        // Check that we're moving to an adjacent main board level (not skipping)
        const zLevels = [0, 8, 16]; // White, Neutral, Black
        const fromZIndex = zLevels.indexOf(fromZ - 4); // Subtract ATTACK_OFFSET
        const toZIndex = zLevels.indexOf(toZ - 4);

        if (fromZIndex !== -1 && toZIndex !== -1) {
          const levelDiff = controller === 'white'
            ? toZIndex - fromZIndex  // White moves up in Z
            : fromZIndex - toZIndex; // Black moves down in Z

          if (levelDiff === 1) {
            // Check rank proximity: pin centers must be within 4 ranks
            const fromCenterRank = fromPin.rankOffset + 0.5;
            const toCenterRank = toPin.rankOffset + 0.5;
            const rankDistance = Math.abs(toCenterRank - fromCenterRank);

            if (rankDistance <= 4) {
              isForwardToNextLevel = true;
            }
          }
        }
      }
    }
  }

  if (!isExplicitlyAdjacent && !isForwardToNextLevel) {
    return { isValid: false, reason: 'Destination pin is not adjacent' };
  }

  const direction = classifyDirection(context.fromPinId, context.toPinId, controller);

  const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
  const isOccupied = passengerPieces.length > 0;

  if (isOccupied) {
    if (direction === 'backward') {
      return { isValid: false, reason: 'Cannot move backward while occupied' };
    }
    if (direction === 'side') {
      const awayLevel = controller === 'white' ? 6 : 1;
      const fromLevel = getPinLevel(context.fromPinId);
      const toLevel = getPinLevel(context.toPinId);
      const distFromAway = Math.abs(fromLevel - awayLevel);
      const distToAway = Math.abs(toLevel - awayLevel);
      const sideIsBackward = distToAway > distFromAway;
      if (sideIsBackward) {
        return { isValid: false, reason: 'Cannot move backward while occupied' };
      }
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
  const destinationZHeight = toPin.zHeight;

  for (const square of destinationSquares) {
    const blockingPiece = context.pieces.find(p => {
      if (p.file !== square.file || p.rank !== square.rank) {
        return false;
      }
      
      if (p.type === 'knight') {
        return false;
      }
      
      if (p.level === context.boardId) {
        return false;
      }
      
      const pieceLevel = p.level;
      if (pieceLevel === 'W' || pieceLevel === 'N' || pieceLevel === 'B') {
        return true;
      }
      
      const piecePinId = context.attackBoardPositions[pieceLevel];
      if (!piecePinId) {
        return true;
      }
      const piecePin = PIN_POSITIONS[piecePinId];
      if (!piecePin) {
        return true;
      }
      const pieceZHeight = piecePin.zHeight;
      return pieceZHeight === destinationZHeight;
    });
    
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
  const baseRank = pin.rankOffset;

  return [
    { file: baseFile, rank: baseRank },
    { file: baseFile + 1, rank: baseRank },
    { file: baseFile, rank: baseRank + 1 },
    { file: baseFile + 1, rank: baseRank + 1 },
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

  const fileOffsetCells = toPin.fileOffset - fromPin.fileOffset;
  const rankOffsetCells = toPin.rankOffset - fromPin.rankOffset;

  const updatedPieces = context.pieces.map(piece => {
    const isPassenger = passengerPieces.includes(piece);
    
    if (!isPassenger) {
      return piece;
    }

    let newFile = piece.file + fileOffsetCells;
    let newRank = piece.rank + rankOffsetCells;

    const applyArrivalRotation = context.rotate || context.arrivalChoice === 'rot180';
    if (applyArrivalRotation) {
      const relativeFile = piece.file - fromPin.fileOffset;
      const relativeRankCells = piece.rank - fromPin.rankOffset;

      const rotated = rotatePassenger180(relativeFile, relativeRankCells);
      const arrival = translatePassenger(
        toPin.fileOffset + rotated.newRelativeFile,
        toPin.rankOffset + rotated.newRelativeRank
      );

      newFile = arrival.file;
      newRank = arrival.rank;
    }

    console.log('[executeBoardMove] Remapping passenger:', {
      type: piece.type,
      from: `${piece.file},${piece.rank},${piece.level}`,
      to: `${newFile},${newRank},${piece.level}`,
    });

    const updatedPiece = {
      ...piece,
      file: newFile,
      rank: newRank,
      hasMoved: true,
    };

    if (piece.type === 'pawn') {
      updatedPiece.movedByAB = true;
    }

    return updatedPiece;
  });

  return {
    updatedPieces,
    updatedPositions,
  };
}
