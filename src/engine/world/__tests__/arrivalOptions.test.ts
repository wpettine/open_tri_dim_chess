import { describe, it, expect } from 'vitest';
import { getArrivalOptions } from '../coordinatesTransform';

describe('arrivalOptions', () => {
  it('should return 2 choices for all moves (identity and rot180)', () => {
    const options = getArrivalOptions('QL', 1, 3, 0, 0, 0, 0);
    
    expect(options).toHaveLength(2);
    expect(options.map(o => o.choice)).toContain('identity');
    expect(options.map(o => o.choice)).toContain('rot180');
  });

  it('should return different coordinates for identity vs rot180', () => {
    const options = getArrivalOptions('QL', 1, 3, 0, 0, 0, 0);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity).toBeDefined();
    expect(rot180).toBeDefined();

    const identitySame = identity.file === rot180.file && identity.rank === rot180.rank;
    expect(identitySame).toBe(false);
  });

  it('should compute correct coordinates for adjacent moves (QL1 -> QL2)', () => {
    const options = getArrivalOptions('QL', 1, 2, 0, 0, 0, 0);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity.file).toBe(0);
    expect(identity.rank).toBe(4);
    
    expect(rot180.file).toBe(1);
    expect(rot180.rank).toBe(5);
  });

  it('should compute correct coordinates for 2-square moves (QL1 -> QL3)', () => {
    const options = getArrivalOptions('QL', 1, 3, 0, 0, 0, 0);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity.file).toBe(0);
    expect(identity.rank).toBe(2);
    
    expect(rot180.file).toBe(1);
    expect(rot180.rank).toBe(3);
  });

  it('should handle KL track correctly', () => {
    const options = getArrivalOptions('KL', 6, 4, 0, 0, 1, 1);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity.file).toBe(5);
    expect(identity.rank).toBe(7);
    
    expect(rot180.file).toBe(4);
    expect(rot180.rank).toBe(6);
  });

  it('should handle rotation changes (0 -> 180)', () => {
    const options = getArrivalOptions('QL', 1, 3, 0, 180, 0, 0);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity.file).toBe(1);
    expect(identity.rank).toBe(3);
    
    expect(rot180.file).toBe(0);
    expect(rot180.rank).toBe(2);
  });

  it('should handle rotation changes (180 -> 180)', () => {
    const options = getArrivalOptions('KL', 6, 4, 180, 180, 1, 1);
    
    const identity = options.find(o => o.choice === 'identity')!;
    const rot180 = options.find(o => o.choice === 'rot180')!;

    expect(identity.file).toBe(4);
    expect(identity.rank).toBe(6);
    
    expect(rot180.file).toBe(5);
    expect(rot180.rank).toBe(7);
  });

  it('should handle different local positions', () => {
    const options1 = getArrivalOptions('QL', 1, 2, 0, 0, 0, 0);
    const options2 = getArrivalOptions('QL', 1, 2, 0, 0, 1, 1);
    
    const id1 = options1.find(o => o.choice === 'identity')!;
    const id2 = options2.find(o => o.choice === 'identity')!;

    expect(id1.file).not.toBe(id2.file);
    expect(id1.rank).not.toBe(id2.rank);
  });
});
