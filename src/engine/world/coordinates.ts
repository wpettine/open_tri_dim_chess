/**
 * Coordinate mapping functions.
 *
 * CRITICAL: These functions are the SINGLE SOURCE OF TRUTH for converting
 * game coordinates (file, rank) to world coordinates (X, Y).
 *
 * REQUIREMENTS:
 * 1. Same rank MUST have same worldY on all boards
 * 2. Same file MUST have same worldX on all boards
 * 3. Must produce even spacing between squares
 * 4. Must be used by BOTH square creation AND piece rendering
 *
 * The values here are carefully chosen to ensure pieces align perfectly
 * with squares and ranks are continuous across all boards.
 */

const SQUARE_SIZE = 2.0;  // Size of each square in world units
const SQUARE_GAP = 0.1;   // Small gap between squares
const SPACING = SQUARE_SIZE + SQUARE_GAP;

// Center the board at world origin
const FILE_OFFSET = -6.0;  // Adjust to center files z-e around origin
const RANK_OFFSET = -9.0;   // Adjust to position ranks 0-9 appropriately

/**
 * Convert file (0-5) to world X coordinate.
 * Files: 0=z, 1=a, 2=b, 3=c, 4=d, 5=e
 */
export function fileToWorldX(file: number): number {
  return file * SPACING + FILE_OFFSET + (SPACING / 2);
}

/**
 * Convert rank (0-9) to world Y coordinate.
 * Ranks are continuous across all boards (0 at bottom, 9 at top).
 * This is THE critical function for maintaining rank continuity.
 */
export function rankToWorldY(rank: number): number {
  return rank * SPACING + RANK_OFFSET + (SPACING / 2);
}

/**
 * Convert file number to string representation.
 */
export function fileToString(file: number): string {
  const files = ['z', 'a', 'b', 'c', 'd', 'e'];
  return files[file] || '?';
}

/**
 * Convert file string to number.
 */
export function stringToFile(fileStr: string): number {
  const files = ['z', 'a', 'b', 'c', 'd', 'e'];
  return files.indexOf(fileStr);
}

/**
 * Create a square ID from components.
 */
export function createSquareId(file: number, rank: number, boardId: string): string {
  return `${fileToString(file)}${rank}${boardId}`;
}

/**
 * Parse a square ID into components.
 */
export function parseSquareId(id: string): { file: number; rank: number; boardId: string } | null {
  // Format: "a2W" (1 char file, 1-2 digit rank, board ID)
  const match = id.match(/^([zabcde])(\d+)(\w+)$/);
  if (!match) return null;

  return {
    file: stringToFile(match[1]),
    rank: parseInt(match[2], 10),
    boardId: match[3],
  };
}
