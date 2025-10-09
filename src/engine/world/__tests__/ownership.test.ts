import { describe, it, expect } from 'vitest';
import { getAdjacentPins, isAdjacent, isPinOccupied, getVacantPins, getPinOwner, getBoardController, getForwardDirection, isForwardMove, isSidewaysMove, deriveInstanceIdForBoard, updateInstanceRotation } from '../ownership';

describe('ownership & adjacency helpers', () => {
  it('adjacency reflects ATTACK_BOARD_ADJACENCY', () => {
    expect(getAdjacentPins('QL1')).toEqual(expect.arrayContaining(['QL2', 'KL1', 'KL2']));
    expect(isAdjacent('QL1', 'KL1')).toBe(true);
    expect(isAdjacent('QL1', 'KL6')).toBe(false);
  });

  it('pin occupancy and vacancy', () => {
    const pos = { WQL: 'QL1', WKL: 'KL6', BQL: 'QL5', BKL: 'KL2' };
    expect(isPinOccupied('QL1', pos)).toBe(true);
    const vacants = getVacantPins('QL1', pos);
    expect(vacants).not.toContain('KL2'); // occupied
  });

  it('ownership by presence', () => {
    const pos = { WQL: 'QL3', WKL: 'KL6', BQL: 'QL5', BKL: 'KL2' };
    expect(getPinOwner('QL3', pos)).toBe('white');
    expect(getPinOwner('QL5', pos)).toBe('black');
    expect(getPinOwner('KL1', pos)).toBeNull();
  });

  it('direction classification and helpers', () => {
    expect(getBoardController('WQL')).toBe('white');
    expect(getBoardController('BKL')).toBe('black');
    expect(getForwardDirection('QL1', 'QL2', 'WQL')).toBe('forward');
    expect(isSidewaysMove('QL2', 'KL2', 'WQL')).toBe(true);
    expect(isForwardMove('KL6', 'KL5', 'BKL')).toBe(true); // black forward toward 1
  });

  it('instance id helpers', () => {
    const id = deriveInstanceIdForBoard('WQL', 'QL3', 0);
    expect(id).toBe('QL3:0');
    const rotated = updateInstanceRotation(id, 180);
    expect(rotated).toBe('QL3:180');
  });
});
