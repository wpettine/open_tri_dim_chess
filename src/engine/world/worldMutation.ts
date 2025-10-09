import type { ChessWorld } from './types';
import type { Piece } from '../../store/gameStore';
import { attackSquareZ } from './pinPositions';
import { PIN_POSITIONS, PIN_FOOTPRINT } from './pinPositions';
import { ATTACK_BOARD_ADJACENCY, classifyDirection } from './attackBoardAdjacency';

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

  if (!adjacencyList.includes(context.toPinId)) {
    return { isValid: false, reason: 'Destination pin is not adjacent' };
  }

  const controller = getBoardController(context.boardId, context.fromPinId, context.pieces);
  const direction = classifyDirection(context.fromPinId, context.toPinId, controller);
  
  const passengerPieces = getPassengerPieces(context.boardId, context.fromPinId, context.pieces);
  const isOccupied = passengerPieces.length > 0;
  
  if (isOccupied && direction === 'backward') {
    return { 
      isValid: false, 
      reason: 'Cannot move backward while occupied' 
    };
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
  const destinationZHeight = attackSquareZ(context.toPinId);

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
      
      let pieceZHeight: number;
      const pieceLevel = p.level;
      
      if (pieceLevel === 'W' || pieceLevel === 'N' || pieceLevel === 'B') {
        const mainLevelZ: Record<string, number> = {
          'W': 0,
          'N': 5,
          'B': 10
        };
        pieceZHeight = mainLevelZ[pieceLevel];
      } else {
        const piecePinId = context.attackBoardPositions[pieceLevel];
        if (!piecePinId) {
          return true;
        }
        const piecePin = PIN_POSITIONS[piecePinId];
        if (!piecePin) {
          return true;
        }
        pieceZHeight = piecePin.zHeight;
      }
      
      return pieceZHeight !== destinationZHeight;
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
  _boardId: string,
  pinId: string
): Array<{ file: number; rank: number }> {
  const fp = PIN_FOOTPRINT[pinId];
  if (!fp) return [];
  const [f0, f1] = fp.files;
  const [r0, r1] = fp.ranks;
  return [
    { file: f0, rank: r0 },
    { file: f1, rank: r0 },
    { file: f0, rank: r1 },
    { file: f1, rank: r1 },
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

  const fromFp = PIN_FOOTPRINT[context.fromPinId];
  const toFp = PIN_FOOTPRINT[context.toPinId];

  const indexOfInFootprint = (file: number, rank: number, fp: { files: [number, number]; ranks: [number, number] }) => {
    const [f0, f1] = fp.files;
    const [r0, r1] = fp.ranks;
    if (file === f0 && rank === r0) return 0; // q1
    if (file === f1 && rank === r0) return 1; // q2
    if (file === f0 && rank === r1) return 2; // q3
    if (file === f1 && rank === r1) return 3; // q4
    return -1;
  };

  const coordsFromIndex = (idx: number, fp: { files: [number, number]; ranks: [number, number] }) => {
    const [f0, f1] = fp.files;
    const [r0, r1] = fp.ranks;
    switch (idx) {
      case 0: return { file: f0, rank: r0 };
      case 1: return { file: f1, rank: r0 };
      case 2: return { file: f0, rank: r1 };
      case 3: return { file: f1, rank: r1 };
      default: return null;
    }
  };

  const rotate180Index = (idx: number) => {
    if (idx === 0) return 2;
    if (idx === 1) return 3;
    if (idx === 2) return 0;
    if (idx === 3) return 1;
    return idx;
  };

  const updatedPieces = context.pieces.map(piece => {
    const isPassenger = passengerPieces.includes(piece);
    if (!isPassenger) return piece;

    const fromIdx = indexOfInFootprint(piece.file, piece.rank, fromFp);
    if (fromIdx === -1) return piece;

    const targetIdx = context.rotate ? rotate180Index(fromIdx) : fromIdx;
    const target = coordsFromIndex(targetIdx, toFp);
    if (!target) return piece;

    console.log('[executeBoardMove] Remapping passenger:', {
      type: piece.type,
      from: `${piece.file},${piece.rank},${piece.level}`,
      to: `${target.file},${target.rank},${piece.level}`,
    });

    return {
      ...piece,
      file: target.file,
      rank: target.rank,
      hasMoved: true,
    };
  });

  return {
    updatedPieces,
    updatedPositions,
  };
}
