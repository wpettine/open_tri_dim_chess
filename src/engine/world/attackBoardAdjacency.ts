export interface AdjacencyEdge {
  to: string;
  dir: string[];
  requiresEmpty: boolean;
}

export const ATTACK_BOARD_ADJACENCY: Record<string, AdjacencyEdge[]> = {
  QL1: [
    { to: 'QL2', dir: ['forward'], requiresEmpty: false },
    { to: 'KL1', dir: ['side'], requiresEmpty: false },
    { to: 'KL2', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  QL2: [
    { to: 'QL1', dir: ['backward'], requiresEmpty: true },
    { to: 'QL3', dir: ['forward'], requiresEmpty: false },
    { to: 'KL1', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'KL2', dir: ['side'], requiresEmpty: false },
    { to: 'KL3', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  QL3: [
    { to: 'QL2', dir: ['backward'], requiresEmpty: true },
    { to: 'QL4', dir: ['forward'], requiresEmpty: false },
    { to: 'KL2', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'KL3', dir: ['side'], requiresEmpty: false },
    { to: 'KL4', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  QL4: [
    { to: 'QL3', dir: ['backward'], requiresEmpty: true },
    { to: 'QL5', dir: ['forward'], requiresEmpty: false },
    { to: 'KL3', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'KL4', dir: ['side'], requiresEmpty: false },
    { to: 'KL5', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  QL5: [
    { to: 'QL4', dir: ['backward'], requiresEmpty: true },
    { to: 'QL6', dir: ['forward'], requiresEmpty: false },
    { to: 'KL4', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'KL5', dir: ['side'], requiresEmpty: false },
    { to: 'KL6', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  QL6: [
    { to: 'QL5', dir: ['backward'], requiresEmpty: true },
    { to: 'KL5', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'KL6', dir: ['side'], requiresEmpty: false },
  ],
  KL1: [
    { to: 'KL2', dir: ['forward'], requiresEmpty: false },
    { to: 'QL1', dir: ['side'], requiresEmpty: false },
    { to: 'QL2', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  KL2: [
    { to: 'KL1', dir: ['backward'], requiresEmpty: true },
    { to: 'KL3', dir: ['forward'], requiresEmpty: false },
    { to: 'QL1', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'QL2', dir: ['side'], requiresEmpty: false },
    { to: 'QL3', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  KL3: [
    { to: 'KL2', dir: ['backward'], requiresEmpty: true },
    { to: 'KL4', dir: ['forward'], requiresEmpty: false },
    { to: 'QL2', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'QL3', dir: ['side'], requiresEmpty: false },
    { to: 'QL4', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  KL4: [
    { to: 'KL3', dir: ['backward'], requiresEmpty: true },
    { to: 'KL5', dir: ['forward'], requiresEmpty: false },
    { to: 'QL3', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'QL4', dir: ['side'], requiresEmpty: false },
    { to: 'QL5', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  KL5: [
    { to: 'KL4', dir: ['backward'], requiresEmpty: true },
    { to: 'KL6', dir: ['forward'], requiresEmpty: false },
    { to: 'QL4', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'QL5', dir: ['side'], requiresEmpty: false },
    { to: 'QL6', dir: ['forward', 'side'], requiresEmpty: false },
  ],
  KL6: [
    { to: 'KL5', dir: ['backward'], requiresEmpty: true },
    { to: 'QL5', dir: ['side', 'backward'], requiresEmpty: true },
    { to: 'QL6', dir: ['side'], requiresEmpty: false },
  ],
};
