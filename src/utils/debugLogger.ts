import { ChessWorld } from '../engine/world/types';

/**
 * Logs detailed coordinate information to console.
 * Call this during development to inspect coordinate mappings.
 */
export function logWorldCoordinates(world: ChessWorld): void {
  console.log('=== WORLD GRID DEBUG INFO ===');

  console.log('\n📋 Boards:');
  world.boards.forEach((board, id) => {
    console.log(`  ${id}: center=(${board.centerX.toFixed(2)}, ${board.centerY.toFixed(2)}, ${board.centerZ.toFixed(2)}), size=${board.size.width}x${board.size.height}`);
  });

  console.log('\n📍 Sample Squares:');
  ['z0WQL', 'a1W', 'b4N', 'c6B', 'e9BKL'].forEach(id => {
    const sq = world.squares.get(id);
    if (sq) {
      console.log(`  ${id}: (${sq.worldX.toFixed(2)}, ${sq.worldY.toFixed(2)}, ${sq.worldZ.toFixed(2)})`);
    } else {
      console.log(`  ${id}: NOT FOUND`);
    }
  });

  console.log('\n🔢 Rank Y Coordinates:');
  for (let rank = 0; rank <= 9; rank++) {
    const sq = world.squares.get(`a${rank}W`) ||
               world.squares.get(`z${rank}WQL`) ||
               world.squares.get(`a${rank}N`) ||
               world.squares.get(`a${rank}B`) ||
               world.squares.get(`z${rank}BQL`);
    if (sq) {
      console.log(`  Rank ${rank}: Y=${sq.worldY.toFixed(2)}`);
    }
  }

  console.log('\n📏 File X Coordinates:');
  ['z', 'a', 'b', 'c', 'd', 'e'].forEach((file, fileNum) => {
    const sq = world.squares.get(`${file}1W`) ||
               world.squares.get(`${file}0WQL`) ||
               world.squares.get(`${file}3N`);
    if (sq) {
      console.log(`  File ${file} (${fileNum}): X=${sq.worldX.toFixed(2)}`);
    }
  });

  console.log('\n✅ Total squares:', world.squares.size);
  console.log('\n=== END DEBUG INFO ===\n');
}
