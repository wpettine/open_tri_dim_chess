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
