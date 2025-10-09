export interface WorldSquare {
  id: string;
  boardId: string;
  file: number;
  rank: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  color: 'light' | 'dark';
}

export interface BoardLayout {
  id: string;
  type: 'main' | 'attack';
  centerX: number;
  centerY: number;
  centerZ: number;
  size: { width: number; height: number };
  rotation: number;
  files: number[];
  ranks: number[];
  track?: 'QL' | 'KL';
  pin?: number;
  isVisible?: boolean;
  isAccessible?: boolean;
}

export interface PinPosition {
  id: string;
  fileOffset: number;
  rankOffset: number;
  zHeight: number;
  adjacentPins: string[];
  level: number;
  inverted: boolean;
}

export interface PinNeighbor {
  track: 'QL' | 'KL';
  pin: number;
}

export interface PinAdjacencyGraph {
  QL: Record<number, PinNeighbor[]>;
  KL: Record<number, PinNeighbor[]>;
}

export interface ChessWorld {
  boards: Map<string, BoardLayout>;
  squares: Map<string, WorldSquare>;
  pins: Map<string, PinPosition>;
  adjacencyGraph?: PinAdjacencyGraph;
}
