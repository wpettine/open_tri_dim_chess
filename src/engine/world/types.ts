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
  visible: boolean;
  accessible: boolean;
  pinId?: string;
  rotationState?: 0 | 180;
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

export interface ChessWorld {
  boards: Map<string, BoardLayout>;
  squares: Map<string, WorldSquare>;
  pins: Map<string, PinPosition>;
}
