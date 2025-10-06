import type { ChessWorld } from '../engine/world/types';

export function logWorldCoordinates(world: ChessWorld): void {
  console.log('=== WORLD GRID DEBUG INFO ===');
  
  console.log('\n📋 Boards:');
  world.boards.forEach((board, id) => {
    console.log(`  ${id}: center=(${board.centerX.toFixed(2)}, ${board.centerY.toFixed(2)}, ${board.centerZ.toFixed(2)}), size=${board.size.width}x${board.size.height}`);
  });
  
  console.log('\n📍 Sample Squares:');
  ['z0WQL', 'a2W', 'b4N', 'c6B', 'e9BKL'].forEach(id => {
    const sq = world.squares.get(id);
    if (sq) {
      console.log(`  ${id}: (${sq.worldX.toFixed(2)}, ${sq.worldY.toFixed(2)}, ${sq.worldZ.toFixed(2)})`);
    }
  });
  
  console.log('\n🔢 Rank Y Coordinates:');
  for (let rank = 0; rank <= 9; rank++) {
    const sq = world.squares.get(`a${rank}WL`) || 
               world.squares.get(`z${rank}WQL`) ||
               world.squares.get(`a${rank}NL`) ||
               world.squares.get(`a${rank}BL`);
    if (sq) {
      console.log(`  Rank ${rank}: Y=${sq.worldY.toFixed(2)}`);
    }
  }
  
  console.log('\n📏 File X Coordinates:');
  ['z', 'a', 'b', 'c', 'd', 'e'].forEach((file, fileNum) => {
    const sq = world.squares.get(`${file}2WL`) || world.squares.get(`${file}0WQL`);
    if (sq) {
      console.log(`  File ${file} (${fileNum}): X=${sq.worldX.toFixed(2)}`);
    }
  });
  
  console.log('\n✅ Total squares:', world.squares.size);
}
