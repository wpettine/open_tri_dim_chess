/**
 * Represents a single square on the chess board in world coordinates.
 * This is the SINGLE SOURCE OF TRUTH for square positions.
 */
export interface WorldSquare {
  id: string;                    // e.g., "a2W", "z0WQL"
  boardId: string;               // "W", "N", "B", "WQL", "WKL", "BQL", "BKL"
  file: number;                  // 0-5 (z, a, b, c, d, e)
  rank: number;                  // 0-9
  level: string;                 // Same as boardId
  worldX: number;                // Three.js X coordinate
  worldY: number;                // Three.js Y coordinate
  worldZ: number;                // Three.js Z coordinate (height)
  isValid: boolean;              // For bounds checking
  color: 'light' | 'dark';       // Square color for rendering
}

/**
 * Represents a board (main or attack) in the game.
 */
export interface BoardLayout {
  id: string;                    // "W", "WQL", etc.
  type: 'main' | 'attack';
  size: { width: number; height: number }; // Number of squares (not world units)
  currentPin?: string;           // For attack boards only
  canMove: boolean;              // Attack boards can move
  centerX: number;               // World coordinate
  centerY: number;               // World coordinate
  centerZ: number;               // World coordinate (height)
  rotation: number;              // 0 or 180 degrees
}

/**
 * Represents a pin position where attack boards can dock.
 */
export interface PinPosition {
  id: string;                    // e.g., "QL1", "KL2"
  fileOffset: number;            // Starting file for 2x2 board
  rankOffset: number;            // Starting rank for 2x2 board
  zHeight: number;               // Height in world coordinates
  adjacentPins: string[];        // IDs of adjacent pins (for movement validation)
  level: number;                 // Relative level (0=lowest, higher=up)
  inverted: boolean;             // Whether board is upside down at this pin
}

/**
 * The complete world grid containing all squares, boards, and pins.
 */
export interface ChessWorld {
  squares: Map<string, WorldSquare>;
  boards: Map<string, BoardLayout>;
  pins: Map<string, PinPosition>;
}
