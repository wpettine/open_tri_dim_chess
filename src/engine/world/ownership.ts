import { PIN_ADJACENCY, getPinColumn, classifyDirection, makeInstanceId, parseInstanceId } from './attackBoardAdjacency';
import type { PinNeighbor } from './types';

export function getAdjacentPins(pinId: string): string[] {
  const col = getPinColumn(pinId) as 'QL' | 'KL';
  const pin = Number(pinId.slice(2)) as 1 | 2 | 3 | 4 | 5 | 6;
  const neighbors = (PIN_ADJACENCY[col]?.[pin] ?? []) as PinNeighbor[];
  return neighbors.map((n: PinNeighbor) => `${n.track}${n.pin}`);
}

export function isAdjacent(a: string, b: string): boolean {
  return getAdjacentPins(a).includes(b);
}

export function isPinOccupied(pinId: string, attackBoardPositions: Record<string, string>): boolean {
  return Object.values(attackBoardPositions).some((p) => p === pinId);
}

export function getVacantPins(fromPinId: string, attackBoardPositions: Record<string, string>): string[] {
  return getAdjacentPins(fromPinId).filter((p) => !isPinOccupied(p, attackBoardPositions));
}

export function getPinOwner(pinId: string, attackBoardPositions: Record<string, string>): 'white' | 'black' | null {
  for (const [boardId, pos] of Object.entries(attackBoardPositions)) {
    if (pos === pinId) {
      if (boardId.startsWith('W')) return 'white';
      if (boardId.startsWith('B')) return 'black';
    }
  }
  return null;
}

export function getBoardController(boardId: string): 'white' | 'black' {
  return boardId.startsWith('W') ? 'white' : 'black';
}

export function getForwardDirection(fromPinId: string, toPinId: string, boardId: string): 'forward' | 'backward' | 'side' {
  const controller = getBoardController(boardId);
  return classifyDirection(fromPinId, toPinId, controller);
}

export function isForwardMove(fromPinId: string, toPinId: string, boardId: string): boolean {
  return getForwardDirection(fromPinId, toPinId, boardId) === 'forward';
}

export function isSidewaysMove(fromPinId: string, toPinId: string, boardId: string): boolean {
  return getForwardDirection(fromPinId, toPinId, boardId) === 'side';
}

export function deriveInstanceIdForBoard(boardId: string, pinId: string, rotation: number): string {
  const track = boardId.endsWith('QL') ? 'QL' : 'KL';
  const pinNum = Number(pinId.slice(2));
  const rot = rotation === 180 ? 180 : 0;
  return makeInstanceId(track as 'QL' | 'KL', pinNum, rot);
}

export function updateInstanceRotation(instanceId: string, rotation: 0 | 180): string {
  const parsed = parseInstanceId(instanceId);
  if (!parsed) return instanceId;
  return makeInstanceId(parsed.track, parsed.pin, rotation);
}
