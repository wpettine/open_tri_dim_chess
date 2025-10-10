import type { ChessWorld } from './types';

export interface TrackStates {
  QL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
  KL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
}

export function updateInstanceVisibility(world: ChessWorld, trackStates: TrackStates) {
  world.boards.forEach((b) => {
    if (b.type === 'attack' && b.id.includes(':')) {
      b.isVisible = false;
      b.isAccessible = false;
    }
  });
  const show = (track: 'QL'|'KL', pin: number, rot: 0|180) => {
    const id = `${track}${pin}:${rot}`;
    const board = world.boards.get(id);
    if (board) {
      board.isVisible = true;
      board.isAccessible = true;
    }
  };
  (['QL','KL'] as const).forEach((track) => {
    const ts = trackStates[track];
    show(track, ts.whiteBoardPin, ts.whiteRotation);
    show(track, ts.blackBoardPin, ts.blackRotation);
  });
}
export function showAllAttackInstances(world: ChessWorld) {
  world.boards.forEach((b) => {
    if (b.type === 'attack' && b.id.includes(':')) {
      b.isVisible = true;
      b.isAccessible = true;
    }
  });
}
