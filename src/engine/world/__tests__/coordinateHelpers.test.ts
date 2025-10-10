import { describe, it, expect } from 'vitest';
import { translatePassenger, rotatePassenger180 } from '../../world/coordinatesTransform';

describe('coordinate helpers', () => {
  it('translatePassenger is identity', () => {
    const res = translatePassenger(3, 4);
    expect(res).toEqual({ file: 3, rank: 4 });
  });

  it('rotatePassenger180 rotates 2x2 local coords', () => {
    expect(rotatePassenger180(0, 0)).toEqual({ newRelativeFile: 1, newRelativeRank: 1 });
    expect(rotatePassenger180(1, 1)).toEqual({ newRelativeFile: 0, newRelativeRank: 0 });
    expect(rotatePassenger180(0, 1)).toEqual({ newRelativeFile: 1, newRelativeRank: 0 });
    expect(rotatePassenger180(1, 0)).toEqual({ newRelativeFile: 0, newRelativeRank: 1 });
  });
});
