import type { ChessWorld } from './types';

export function getInstanceId(
  baseId: string,
  pinId: string,
  rotation: 0 | 180
): string {
  return rotation === 0 ? `${baseId}_${pinId}` : `${baseId}_${pinId}_R180`;
}

export function parseInstanceId(instanceId: string): {
  baseId: string;
  pinId: string;
  rotation: 0 | 180;
} | null {
  const r180Match = instanceId.match(/^([A-Z]+)_([A-Z0-9]+)_R180$/);
  if (r180Match) {
    return {
      baseId: r180Match[1],
      pinId: r180Match[2],
      rotation: 180,
    };
  }

  const normalMatch = instanceId.match(/^([A-Z]+)_([A-Z0-9]+)$/);
  if (normalMatch) {
    return {
      baseId: normalMatch[1],
      pinId: normalMatch[2],
      rotation: 0,
    };
  }

  return null;
}

export function toggleBoardVisibility(
  world: ChessWorld,
  oldInstanceId: string,
  newInstanceId: string
): void {
  const oldBoard = world.boards.get(oldInstanceId);
  const newBoard = world.boards.get(newInstanceId);

  if (oldBoard) {
    oldBoard.visible = false;
    oldBoard.accessible = false;
    world.boards.set(oldInstanceId, oldBoard);
  }

  if (newBoard) {
    newBoard.visible = true;
    newBoard.accessible = true;
    world.boards.set(newInstanceId, newBoard);
  }
}

export function getCurrentInstance(
  world: ChessWorld,
  baseId: string,
  pinId: string,
  rotation: 0 | 180
): string {
  return getInstanceId(baseId, pinId, rotation);
}

export function getVisibleInstanceForBase(
  world: ChessWorld,
  baseId: string
): string | null {
  for (const [instanceId, board] of world.boards.entries()) {
    if (board.visible && instanceId.startsWith(baseId + '_')) {
      return instanceId;
    }
  }
  return null;
}

export function getBaseIdFromInstance(instanceId: string): string {
  if (instanceId === 'W' || instanceId === 'N' || instanceId === 'B') {
    return instanceId;
  }
  
  const parsed = parseInstanceId(instanceId);
  if (parsed) {
    return parsed.baseId;
  }
  
  return instanceId;
}

export function isInstanceOfBase(instanceId: string, baseId: string): boolean {
  if (baseId === 'W' || baseId === 'N' || baseId === 'B') {
    return instanceId === baseId;
  }
  
  return instanceId.startsWith(baseId + '_');
}
