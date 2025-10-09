export const ATTACK_BOARD_ADJACENCY: Record<string, string[]> = {
  QL1: ['QL2', 'KL1', 'KL2'],
  QL2: ['QL1', 'QL3', 'KL1', 'KL2', 'KL3'],
  QL3: ['QL2', 'QL4', 'KL2', 'KL3', 'KL4'],
  QL4: ['QL3', 'QL5', 'KL3', 'KL4', 'KL5'],
  QL5: ['QL4', 'QL6', 'KL4', 'KL5', 'KL6'],
  QL6: ['QL5', 'KL5', 'KL6'],
  KL1: ['KL2', 'QL1', 'QL2'],
  KL2: ['KL1', 'KL3', 'QL1', 'QL2', 'QL3'],
  KL3: ['KL2', 'KL4', 'QL2', 'QL3', 'QL4'],
  KL4: ['KL3', 'KL5', 'QL3', 'QL4', 'QL5'],
  KL5: ['KL4', 'KL6', 'QL4', 'QL5', 'QL6'],
  KL6: ['KL5', 'QL5', 'QL6'],
};

const PIN_LEVEL_INDEX: Record<string, number> = {
  QL1: 1, QL2: 2, QL3: 3, QL4: 4, QL5: 5, QL6: 6,
  KL1: 1, KL2: 2, KL3: 3, KL4: 4, KL5: 5, KL6: 6,
};

export function getPinLevel(pinId: string): number {
  return PIN_LEVEL_INDEX[pinId];
}

export function getPinColumn(pinId: string): 'QL' | 'KL' {
  return pinId.substring(0, 2) as 'QL' | 'KL';
}

export function classifyDirection(
  fromPinId: string,
  toPinId: string,
  controller: 'white' | 'black'
): 'forward' | 'backward' | 'side' {
  const fromColumn = getPinColumn(fromPinId);
  const toColumn = getPinColumn(toPinId);
  
  if (fromColumn !== toColumn) {
    return 'side';
  }
  
  const fromLevel = getPinLevel(fromPinId);
  const toLevel = getPinLevel(toPinId);
  const awayLevel = controller === 'white' ? 6 : 1;
  
  const distFromAway = Math.abs(fromLevel - awayLevel);
  const distToAway = Math.abs(toLevel - awayLevel);
  
  return distToAway < distFromAway ? 'forward' : 'backward';
}

export const PIN_RANK_OFFSETS: Record<number, number> = { 1: 0, 2: 4, 3: 2, 4: 6, 5: 4, 6: 8 };

export function makeInstanceId(track: 'QL' | 'KL', pin: number, rotation: 0 | 180) {
  return `${track}${pin}:${rotation}`;
}

export function parseInstanceId(id: string): { track: 'QL' | 'KL'; pin: number; rotation: 0 | 180 } | null {
  const m = id.match(/^(QL|KL)([1-6]):(0|180)$/);
  if (!m) return null;
  return { track: m[1] as 'QL' | 'KL', pin: Number(m[2]), rotation: Number(m[3]) as 0 | 180 };
}

export const PIN_ADJACENCY = {
  QL: {
    1: [{ track: 'QL', pin: 2 }, { track: 'KL', pin: 1 }, { track: 'KL', pin: 2 }],
    2: [{ track: 'QL', pin: 1 }, { track: 'QL', pin: 3 }, { track: 'KL', pin: 1 }, { track: 'KL', pin: 2 }, { track: 'KL', pin: 3 }],
    3: [{ track: 'QL', pin: 2 }, { track: 'QL', pin: 4 }, { track: 'KL', pin: 2 }, { track: 'KL', pin: 3 }, { track: 'KL', pin: 4 }],
    4: [{ track: 'QL', pin: 3 }, { track: 'QL', pin: 5 }, { track: 'KL', pin: 3 }, { track: 'KL', pin: 4 }, { track: 'KL', pin: 5 }],
    5: [{ track: 'QL', pin: 4 }, { track: 'QL', pin: 6 }, { track: 'KL', pin: 4 }, { track: 'KL', pin: 5 }, { track: 'KL', pin: 6 }],
    6: [{ track: 'QL', pin: 5 }, { track: 'KL', pin: 5 }, { track: 'KL', pin: 6 }],
  },
  KL: {
    1: [{ track: 'KL', pin: 2 }, { track: 'QL', pin: 1 }, { track: 'QL', pin: 2 }],
    2: [{ track: 'KL', pin: 1 }, { track: 'KL', pin: 3 }, { track: 'QL', pin: 1 }, { track: 'QL', pin: 2 }, { track: 'QL', pin: 3 }],
    3: [{ track: 'KL', pin: 2 }, { track: 'KL', pin: 4 }, { track: 'QL', pin: 2 }, { track: 'QL', pin: 3 }, { track: 'QL', pin: 4 }],
    4: [{ track: 'KL', pin: 3 }, { track: 'KL', pin: 5 }, { track: 'QL', pin: 3 }, { track: 'QL', pin: 4 }, { track: 'QL', pin: 5 }],
    5: [{ track: 'KL', pin: 4 }, { track: 'KL', pin: 6 }, { track: 'QL', pin: 4 }, { track: 'QL', pin: 5 }, { track: 'QL', pin: 6 }],
    6: [{ track: 'KL', pin: 5 }, { track: 'QL', pin: 5 }, { track: 'QL', pin: 6 }],
  },
};
