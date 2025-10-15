import { Piece } from '../../store/gameStore';
import { ChessWorld, WorldSquare } from '../world/types';
import { TrackStates } from '../world/visibility';
import { isInCheck, isSquareAttacked } from './checkDetection';
import { fileToString } from '../world/coordinates';
import { getBoardController } from '../world/ownership';

export type CastleType = 'kingside-ql' | 'kingside-kl' | 'queenside';

export interface CastleRequest {
  color: 'white' | 'black';
  castleType: CastleType;
}

export interface CastleValidation {
  valid: boolean;
  reason?: string;

  kingFrom?: { file: number; rank: number; level: string };
  kingTo?: { file: number; rank: number; level: string };
  rookFrom?: { file: number; rank: number; level: string };
  rookTo?: { file: number; rank: number; level: string };

  involvedBoards?: string[];
}

export interface CastleContext {
  color: 'white' | 'black';
  castleType: CastleType;
  pieces: Piece[];
  world: ChessWorld;
  trackStates: TrackStates;
  currentTurn: 'white' | 'black';
  attackBoardActivatedThisTurn: boolean;
  attackBoardStates?: Record<string, { activeInstanceId: string }>;
}

function getOpponentColor(color: 'white' | 'black'): 'white' | 'black' {
  return color === 'white' ? 'black' : 'white';
}

export function validateCastle(context: CastleContext): CastleValidation {
  const { color, castleType, pieces, world, attackBoardActivatedThisTurn, attackBoardStates } = context;

  if (attackBoardActivatedThisTurn) {
    return { valid: false, reason: 'Cannot castle after attack board activation' };
  }

  if (isInCheck(color, world, pieces, attackBoardStates)) {
    return { valid: false, reason: 'Cannot castle while in check' };
  }

  if (castleType === 'kingside-ql' || castleType === 'kingside-kl') {
    return validateKingsideCastle(context);
  } else if (castleType === 'queenside') {
    return validateQueensideCastle(context);
  }

  return { valid: false, reason: 'Unknown castle type' };
}

function validateKingsideCastle(context: CastleContext): CastleValidation {
  const { color, castleType, pieces, world, trackStates, attackBoardStates } = context;

  const track: 'QL' | 'KL' = castleType === 'kingside-ql' ? 'QL' : 'KL';
  const pin = color === 'white' ? 1 : 6;
  const backRank = color === 'white' ? 0 : 9;

  const trackState = trackStates[track];
  const boardPin = color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
  const rotation = color === 'white' ? trackState.whiteRotation : trackState.blackRotation;

  if (boardPin !== pin) {
    return { valid: false, reason: `${track} board not at starting position` };
  }

  const boardId = color === 'white' ? `W${track}` : `B${track}`;
  const controller = getBoardController(boardId);
  if (controller !== color) {
    return { valid: false, reason: `${track} board not controlled by ${color}` };
  }

  const instanceId = `${track}${pin}:${rotation}`;

  const king = pieces.find(p =>
    p.type === 'king' &&
    p.color === color &&
    p.level === instanceId &&
    p.rank === backRank
  );

  const rook = pieces.find(p =>
    p.type === 'rook' &&
    p.color === color &&
    p.level === instanceId &&
    p.rank === backRank
  );

  if (!king) {
    return { valid: false, reason: `King not found on ${instanceId}` };
  }

  if (!rook) {
    return { valid: false, reason: `Rook not found on ${instanceId}` };
  }

  if (king.hasMoved) {
    return { valid: false, reason: 'King has already moved' };
  }

  if (rook.hasMoved) {
    return { valid: false, reason: 'Rook has already moved' };
  }

  const kingSquareId = `${fileToString(king.file)}${king.rank}${instanceId}`;
  const kingSquare = world.squares.get(kingSquareId);
  if (!kingSquare) {
    return { valid: false, reason: 'King square not found' };
  }

  if (isSquareAttacked(kingSquare, getOpponentColor(color), world, pieces, attackBoardStates)) {
    return { valid: false, reason: 'King is in check' };
  }

  const rookSquareId = `${fileToString(rook.file)}${rook.rank}${instanceId}`;
  const rookSquare = world.squares.get(rookSquareId);
  if (!rookSquare) {
    return { valid: false, reason: 'Rook square not found' };
  }

  if (isSquareAttacked(rookSquare, getOpponentColor(color), world, pieces, attackBoardStates)) {
    return { valid: false, reason: 'King destination square is attacked' };
  }

  return {
    valid: true,
    kingFrom: { file: king.file, rank: king.rank, level: king.level },
    kingTo: { file: rook.file, rank: rook.rank, level: rook.level },
    rookFrom: { file: rook.file, rank: rook.rank, level: rook.level },
    rookTo: { file: king.file, rank: king.rank, level: king.level },
    involvedBoards: [instanceId],
  };
}

function validateQueensideCastle(context: CastleContext): CastleValidation {
  const { color, pieces, world, trackStates, attackBoardStates } = context;

  const backRank = color === 'white' ? 0 : 9;
  const pin = color === 'white' ? 1 : 6;

  const qlState = trackStates.QL;
  const klState = trackStates.KL;

  const qlPin = color === 'white' ? qlState.whiteBoardPin : qlState.blackBoardPin;
  const klPin = color === 'white' ? klState.whiteBoardPin : klState.blackBoardPin;

  if (qlPin !== pin || klPin !== pin) {
    return { valid: false, reason: 'Bridge boards not at starting positions' };
  }

  const qlBoardId = color === 'white' ? 'WQL' : 'BQL';
  const klBoardId = color === 'white' ? 'WKL' : 'BKL';

  const qlController = getBoardController(qlBoardId);
  const klController = getBoardController(klBoardId);

  if (qlController !== color || klController !== color) {
    return { valid: false, reason: 'Bridge boards not both controlled by player' };
  }

  const qlRotation = color === 'white' ? qlState.whiteRotation : qlState.blackRotation;
  const klRotation = color === 'white' ? klState.whiteRotation : klState.blackRotation;
  const qlInstanceId = `QL${pin}:${qlRotation}`;
  const klInstanceId = `KL${pin}:${klRotation}`;

  const king = pieces.find(p =>
    p.type === 'king' &&
    p.color === color &&
    (p.level === qlInstanceId || p.level === klInstanceId) &&
    p.rank === backRank
  );

  const rook = pieces.find(p =>
    p.type === 'rook' &&
    p.color === color &&
    (p.level === qlInstanceId || p.level === klInstanceId) &&
    p.rank === backRank
  );

  if (!king) {
    return { valid: false, reason: 'King not found on bridge boards' };
  }

  if (!rook) {
    return { valid: false, reason: 'Rook not found on bridge boards' };
  }

  if (king.level === rook.level) {
    return { valid: false, reason: 'King and rook must be on opposite bridge boards for queenside castle' };
  }

  if (king.hasMoved || rook.hasMoved) {
    return { valid: false, reason: 'King or rook has already moved' };
  }

  const kingSquareId = `${fileToString(king.file)}${king.rank}${king.level}`;
  const kingSquare = world.squares.get(kingSquareId);

  if (!kingSquare) {
    return { valid: false, reason: 'King square not found' };
  }

  if (isSquareAttacked(kingSquare, getOpponentColor(color), world, pieces, attackBoardStates)) {
    return { valid: false, reason: 'King is in check' };
  }

  const kingDestSquareId = `${fileToString(rook.file)}${rook.rank}${rook.level}`;
  const kingDestSquare = world.squares.get(kingDestSquareId);

  if (!kingDestSquare) {
    return { valid: false, reason: 'King destination square not found' };
  }

  if (isSquareAttacked(kingDestSquare, getOpponentColor(color), world, pieces, attackBoardStates)) {
    return { valid: false, reason: 'King destination square is attacked' };
  }

  return {
    valid: true,
    kingFrom: { file: king.file, rank: king.rank, level: king.level },
    kingTo: { file: rook.file, rank: rook.rank, level: rook.level },
    rookFrom: { file: rook.file, rank: rook.rank, level: rook.level },
    rookTo: { file: king.file, rank: king.rank, level: king.level },
    involvedBoards: [qlInstanceId, klInstanceId],
  };
}

export function getCastlingOptions(
  color: 'white' | 'black',
  pieces: Piece[],
  world: ChessWorld,
  trackStates: TrackStates,
  currentTurn: 'white' | 'black',
  attackBoardActivatedThisTurn: boolean,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): CastleType[] {
  if (color !== currentTurn) return [];
  if (attackBoardActivatedThisTurn) return [];

  const options: CastleType[] = [];

  const kingsideQL = validateCastle({
    color,
    castleType: 'kingside-ql',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
    attackBoardStates,
  });
  if (kingsideQL.valid) options.push('kingside-ql');

  const kingsideKL = validateCastle({
    color,
    castleType: 'kingside-kl',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
    attackBoardStates,
  });
  if (kingsideKL.valid) options.push('kingside-kl');

  const queenside = validateCastle({
    color,
    castleType: 'queenside',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
    attackBoardStates,
  });
  if (queenside.valid) options.push('queenside');

  return options;
}
