import { describe, it, expect } from 'vitest';
import { PIN_ADJACENCY, PIN_RANK_OFFSETS, makeInstanceId, parseInstanceId } from '../attackBoardAdjacency';

describe('instance id helpers', () => {
  it('formats and parses instance ids', () => {
    const id = makeInstanceId('QL', 3, 180);
    expect(id).toBe('QL3:180');
    const parsed = parseInstanceId(id);
    expect(parsed).toBeTruthy();
    expect(parsed?.track).toBe('QL');
    expect(parsed?.pin).toBe(3);
    expect(parsed?.rotation).toBe(180);
  });
});

describe('constants', () => {
  it('has rank offsets for all pins', () => {
    [1, 2, 3, 4, 5, 6].forEach((p) => expect(PIN_RANK_OFFSETS[p]).toBeDefined());
  });
  it('adjacency graph includes both tracks', () => {
    expect(Object.keys(PIN_ADJACENCY)).toEqual(expect.arrayContaining(['QL', 'KL']));
  });
});
