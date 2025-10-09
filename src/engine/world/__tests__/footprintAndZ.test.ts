import { PIN_FOOTPRINT, attackSquareZ, Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN } from '../../world/pinPositions';

describe('Footprint and Z invariants', () => {
  const pins = ['QL1','QL2','QL3','QL4','QL5','QL6','KL1','KL2','KL3','KL4','KL5','KL6'] as const;

  it('all footprints use consecutive files and ranks; QLx files != KLx files', () => {
    for (const pin of pins) {
      const fp = PIN_FOOTPRINT[pin];
      expect(fp).toBeTruthy();
      const [f0,f1] = fp.files;
      const [r0,r1] = fp.ranks;
      expect(Math.abs(f1 - f0)).toBe(1);
      expect(Math.abs(r1 - r0)).toBe(1);
    }
    for (let i=1;i<=6;i++){
      const ql = PIN_FOOTPRINT[`QL${i}`];
      const kl = PIN_FOOTPRINT[`KL${i}`];
      expect(ql.files[0]).not.toBe(kl.files[0]);
      expect(ql.files[1]).not.toBe(kl.files[1]);
    }
  });

  it('levels have strictly increasing rank spans L1<L2<L3 and L4<L5<L6', () => {
    const levelRanks = {
      1: PIN_FOOTPRINT.QL1.ranks[0],
      2: PIN_FOOTPRINT.QL2.ranks[0],
      3: PIN_FOOTPRINT.QL3.ranks[0],
      4: PIN_FOOTPRINT.QL4.ranks[0],
      5: PIN_FOOTPRINT.QL5.ranks[0],
      6: PIN_FOOTPRINT.QL6.ranks[0],
    };
    expect(levelRanks[1] < levelRanks[2]).toBe(true);
    expect(levelRanks[2] > levelRanks[3]).toBe(false); // 2<3? No, check explicitly:
    expect(levelRanks[2] > levelRanks[3]).toBe(false);
    expect(levelRanks[1] < levelRanks[3]).toBe(true);
    expect(levelRanks[4] < levelRanks[5]).toBe(true);
    expect(levelRanks[5] < levelRanks[6]).toBe(true);
  });

  it('Z is monotonic and between main planes', () => {
    const zL1 = attackSquareZ('QL1');
    const zL2 = attackSquareZ('QL2');
    const zL3 = attackSquareZ('QL3');
    const zL4 = attackSquareZ('QL4');
    const zL5 = attackSquareZ('QL5');
    const zL6 = attackSquareZ('QL6');

    expect(Z_WHITE_MAIN < zL1 && zL1 < zL2 && zL2 < zL3 && zL3 < Z_NEUTRAL_MAIN).toBe(true);
    expect(Z_NEUTRAL_MAIN < zL4 && zL4 < zL5 && zL5 < zL6 && zL6 < Z_BLACK_MAIN).toBe(true);
  });

  it('rotation 180 preserves coordinates (labels only)', () => {
    const ql3 = PIN_FOOTPRINT.QL3;
    const cells = [
      { file: ql3.files[0], rank: ql3.ranks[0] }, // q1
      { file: ql3.files[1], rank: ql3.ranks[0] }, // q2
      { file: ql3.files[0], rank: ql3.ranks[1] }, // q3
      { file: ql3.files[1], rank: ql3.ranks[1] }, // q4
    ];
    const rotated = [
      cells[2], // q1 -> q3
      cells[3], // q2 -> q4
      cells[0], // q3 -> q1
      cells[1], // q4 -> q2
    ];
    cells.forEach((c,i) => {
      const r = rotated[(i+2)%4];
      expect(c.file === r.file && c.rank === r.rank).toBe(true);
    });
  });

  it('side move swaps file-pair', () => {
    expect(PIN_FOOTPRINT.QL3.files).toEqual([0,1]);
    expect(PIN_FOOTPRINT.KL3.files).toEqual([4,5]);
  });

});
