import { describe, it, expect } from 'vitest';
import { calculateArrivalCoordinates, getArrivalOptions, type ArrivalInput } from '../coordinatesTransform';

describe('coordinatesTransform', () => {
  const cases: Array<{ name: string; input: ArrivalInput; identity: { file: number; rank: number }; rot180: { file: number; rank: number } }> = [
    {
      name: 'QL pin1 -> pin3 rotation 0->0 local(0,0)',
      input: { track: 'QL', fromPin: 1, toPin: 3, fromRotation: 0, toRotation: 0, localFile: 0, localRank: 0 },
      identity: { file: 0, rank: 2 },
      rot180: { file: 1, rank: 3 },
    },
    {
      name: 'QL pin1 -> pin3 rotation 0->180 local(0,0)',
      input: { track: 'QL', fromPin: 1, toPin: 3, fromRotation: 0, toRotation: 180, localFile: 0, localRank: 0 },
      identity: { file: 1, rank: 3 },
      rot180: { file: 0, rank: 2 },
    },
    {
      name: 'KL pin6 -> pin4 rotation 0->0 local(1,1)',
      input: { track: 'KL', fromPin: 6, toPin: 4, fromRotation: 0, toRotation: 0, localFile: 1, localRank: 1 },
      identity: { file: 5, rank: 7 },
      rot180: { file: 4, rank: 6 },
    },
    {
      name: 'KL pin6 -> pin4 rotation 180->180 local(1,1)',
      input: { track: 'KL', fromPin: 6, toPin: 4, fromRotation: 180, toRotation: 180, localFile: 1, localRank: 1 },
      identity: { file: 4, rank: 6 },
      rot180: { file: 5, rank: 7 },
    },
  ];

  for (const c of cases) {
    it(`calculateArrivalCoordinates ${c.name} identity`, () => {
      const res = calculateArrivalCoordinates(c.input, 'identity');
      expect(res).toEqual(c.identity);
    });
    it(`calculateArrivalCoordinates ${c.name} rot180`, () => {
      const res = calculateArrivalCoordinates(c.input, 'rot180');
      expect(res).toEqual(c.rot180);
    });
  }

  it('getArrivalOptions returns two options with correct coords', () => {
    const opts = getArrivalOptions('QL', 1, 2, 0, 0, 0, 0);
    expect(opts).toHaveLength(2);
    const ids = opts.find(o => o.choice === 'identity')!;
    const rot = opts.find(o => o.choice === 'rot180')!;
    expect(ids).toBeTruthy();
    expect(rot).toBeTruthy();
    expect(ids.file).toBeDefined();
    expect(rot.file).toBeDefined();
  });
});
