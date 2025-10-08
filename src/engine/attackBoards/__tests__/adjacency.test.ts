import { describe, it, expect } from 'vitest';
import { arePinsAdjacent, getAdjacentPins, getBoardMoveDirection } from '../adjacency';

describe('Pin Adjacency Graph', () => {
  it('should recognize adjacent pins on same side', () => {
    expect(arePinsAdjacent('QL1', 'QL2')).toBe(true);
    expect(arePinsAdjacent('QL2', 'QL1')).toBe(true);
    expect(arePinsAdjacent('KL3', 'KL4')).toBe(true);
  });

  it('should recognize cross-side adjacency', () => {
    expect(arePinsAdjacent('QL1', 'KL1')).toBe(true);
    expect(arePinsAdjacent('QL2', 'KL2')).toBe(true);
    expect(arePinsAdjacent('KL3', 'QL3')).toBe(true);
  });

  it('should reject non-adjacent pins', () => {
    expect(arePinsAdjacent('QL1', 'QL3')).toBe(false);
    expect(arePinsAdjacent('QL1', 'QL6')).toBe(false);
    expect(arePinsAdjacent('KL1', 'KL5')).toBe(false);
  });

  it('should return correct adjacent pins for level 1', () => {
    const adjacent = getAdjacentPins('QL1');
    expect(adjacent).toContain('QL2');
    expect(adjacent).toContain('KL1');
    expect(adjacent).toContain('KL2');
    expect(adjacent.length).toBe(3);
  });

  it('should return correct adjacent pins for level 3', () => {
    const adjacent = getAdjacentPins('QL3');
    expect(adjacent).toContain('QL2');
    expect(adjacent).toContain('QL4');
    expect(adjacent).toContain('KL2');
    expect(adjacent).toContain('KL3');
    expect(adjacent).toContain('KL4');
    expect(adjacent.length).toBe(5);
  });

  it('should return correct adjacent pins for level 6', () => {
    const adjacent = getAdjacentPins('QL6');
    expect(adjacent).toContain('QL5');
    expect(adjacent).toContain('KL5');
    expect(adjacent).toContain('KL6');
    expect(adjacent.length).toBe(3);
  });

  it('should identify forward movement (same side, higher level)', () => {
    expect(getBoardMoveDirection('QL1', 'QL2')).toBe('forward');
    expect(getBoardMoveDirection('KL3', 'KL5')).toBe('forward');
  });

  it('should identify backward movement (same side, lower level)', () => {
    expect(getBoardMoveDirection('QL3', 'QL2')).toBe('backward');
    expect(getBoardMoveDirection('KL6', 'KL5')).toBe('backward');
  });

  it('should identify side movement (cross-side)', () => {
    expect(getBoardMoveDirection('QL1', 'KL1')).toBe('side');
    expect(getBoardMoveDirection('KL3', 'QL4')).toBe('side');
    expect(getBoardMoveDirection('QL5', 'KL5')).toBe('side');
  });
});
