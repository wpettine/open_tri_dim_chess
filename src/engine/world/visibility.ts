import type { ChessWorld } from './types';

export interface TrackStates {
  QL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
  KL: { whiteBoardPin: number; blackBoardPin: number; whiteRotation: 0 | 180; blackRotation: 0 | 180 };
}

export function updateInstanceVisibility(world: ChessWorld, trackStates: TrackStates) {
  console.log('[updateInstanceVisibility] START', { trackStates });

  // Hide all attack boards
  let hiddenCount = 0;
  const hiddenInstances: string[] = [];
  world.boards.forEach((b) => {
    if (b.type === 'attack' && b.id.includes(':') && b.isVisible) {
      b.isVisible = false;
      b.isAccessible = false;
      hiddenCount++;
      hiddenInstances.push(b.id);
    }
  });
  console.log('[updateInstanceVisibility] Hid', hiddenCount, 'instances:', hiddenInstances);

  // Show 4 active instances
  const instancesToShow = [
    `QL${trackStates.QL.whiteBoardPin}:${trackStates.QL.whiteRotation}`,
    `KL${trackStates.KL.whiteBoardPin}:${trackStates.KL.whiteRotation}`,
    `QL${trackStates.QL.blackBoardPin}:${trackStates.QL.blackRotation}`,
    `KL${trackStates.KL.blackBoardPin}:${trackStates.KL.blackRotation}`,
  ];
  console.log('[updateInstanceVisibility] Should show:', instancesToShow);

  const show = (track: 'QL'|'KL', pin: number, rot: 0|180) => {
    const id = `${track}${pin}:${rot}`;
    const board = world.boards.get(id);
    if (board) {
      console.log('[updateInstanceVisibility] Showing:', id);
      board.isVisible = true;
      board.isAccessible = true;
    } else {
      console.error('[updateInstanceVisibility] Instance not found:', id);
    }
  };

  (['QL','KL'] as const).forEach((track) => {
    const ts = trackStates[track];
    show(track, ts.whiteBoardPin, ts.whiteRotation);
    show(track, ts.blackBoardPin, ts.blackRotation);
  });

  console.log('[updateInstanceVisibility] END');
}
export function showAllAttackInstances(world: ChessWorld) {
  world.boards.forEach((b) => {
    if (b.type === 'attack' && b.id.includes(':')) {
      b.isVisible = true;
      b.isAccessible = true;
    }
  });
}

export function setVisibleInstances(world: ChessWorld, instanceIds: string[]) {
  console.log('[setVisibleInstances] START', { instanceIds });

  // Hide all attack boards
  let hiddenCount = 0;
  const hiddenInstances: string[] = [];
  world.boards.forEach((b) => {
    if (b.type === 'attack' && b.id.includes(':') && b.isVisible) {
      b.isVisible = false;
      b.isAccessible = false;
      hiddenCount++;
      hiddenInstances.push(b.id);
    }
  });
  console.log('[setVisibleInstances] Hid', hiddenCount, 'instances:', hiddenInstances);

  // Show specified instances
  const shownInstances: string[] = [];
  instanceIds.forEach(instanceId => {
    const board = world.boards.get(instanceId);
    if (board) {
      console.log('[setVisibleInstances] Showing:', instanceId);
      board.isVisible = true;
      board.isAccessible = true;
      shownInstances.push(instanceId);
    } else {
      console.error('[setVisibleInstances] Instance not found:', instanceId);
    }
  });
  console.log('[setVisibleInstances] Shown', shownInstances.length, 'instances:', shownInstances);

  console.log('[setVisibleInstances] END');
}
