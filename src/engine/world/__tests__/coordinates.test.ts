import { describe, it, expect } from 'vitest';
import { stringToFile, fileToString, FILE_LETTERS } from '../coordinates';

describe('File Mapping Verification', () => {
  describe('stringToFile', () => {
    it('should map z to 0', () => {
      expect(stringToFile('z')).toBe(0);
    });

    it('should map a to 1', () => {
      expect(stringToFile('a')).toBe(1);
    });

    it('should map b to 2', () => {
      expect(stringToFile('b')).toBe(2);
    });

    it('should map c to 3', () => {
      expect(stringToFile('c')).toBe(3);
    });

    it('should map d to 4', () => {
      expect(stringToFile('d')).toBe(4);
    });

    it('should map e to 5', () => {
      expect(stringToFile('e')).toBe(5);
    });

    it('should throw error for invalid file letter', () => {
      expect(() => stringToFile('f')).toThrow('Invalid file letter: f');
      expect(() => stringToFile('x')).toThrow('Invalid file letter: x');
      expect(() => stringToFile('1')).toThrow();
    });
  });

  describe('fileToString', () => {
    it('should map 0 to z', () => {
      expect(fileToString(0)).toBe('z');
    });

    it('should map 1 to a', () => {
      expect(fileToString(1)).toBe('a');
    });

    it('should map 2 to b', () => {
      expect(fileToString(2)).toBe('b');
    });

    it('should map 3 to c', () => {
      expect(fileToString(3)).toBe('c');
    });

    it('should map 4 to d', () => {
      expect(fileToString(4)).toBe('d');
    });

    it('should map 5 to e', () => {
      expect(fileToString(5)).toBe('e');
    });
  });

  describe('Round-trip conversion', () => {
    it('should convert file letter to number and back correctly', () => {
      FILE_LETTERS.forEach((letter, index) => {
        expect(stringToFile(letter)).toBe(index);
        expect(fileToString(index)).toBe(letter);
        expect(fileToString(stringToFile(letter))).toBe(letter);
      });
    });
  });

  describe('Color formula verification with file numbers', () => {
    it('should produce correct color parity for a1 (dark)', () => {
      // a1: file=1, rank=1 → (1+1)%2 = 0 = dark
      const file = stringToFile('a');
      const rank = 1;
      expect((file + rank) % 2).toBe(0);
    });

    it('should produce correct color parity for b1 (light)', () => {
      // b1: file=2, rank=1 → (2+1)%2 = 1 = light
      const file = stringToFile('b');
      const rank = 1;
      expect((file + rank) % 2).toBe(1);
    });

    it('should produce correct color parity for a2 (light)', () => {
      // a2: file=1, rank=2 → (1+2)%2 = 1 = light
      const file = stringToFile('a');
      const rank = 2;
      expect((file + rank) % 2).toBe(1);
    });

    it('should produce correct color parity for a3 (dark)', () => {
      // a3: file=1, rank=3 → (1+3)%2 = 0 = dark
      const file = stringToFile('a');
      const rank = 3;
      expect((file + rank) % 2).toBe(0);
    });

    it('should produce correct color parity for z0 (dark)', () => {
      // z0: file=0, rank=0 → (0+0)%2 = 0 = dark
      const file = stringToFile('z');
      const rank = 0;
      expect((file + rank) % 2).toBe(0);
    });

    it('should produce correct color parity for z1 (light)', () => {
      // z1: file=0, rank=1 → (0+1)%2 = 1 = light
      const file = stringToFile('z');
      const rank = 1;
      expect((file + rank) % 2).toBe(1);
    });

    it('should produce correct color parity for e0 (light)', () => {
      // e0: file=5, rank=0 → (5+0)%2 = 1 = light
      const file = stringToFile('e');
      const rank = 0;
      expect((file + rank) % 2).toBe(1);
    });

    it('should produce correct color parity for e1 (dark)', () => {
      // e1: file=5, rank=1 → (5+1)%2 = 0 = dark
      const file = stringToFile('e');
      const rank = 1;
      expect((file + rank) % 2).toBe(0);
    });

    it('should produce correct color parity for d9 (light)', () => {
      // d9: file=4, rank=9 → (4+9)%2 = 1 = light
      const file = stringToFile('d');
      const rank = 9;
      expect((file + rank) % 2).toBe(1);
    });
  });

  describe('Checkerboard pattern verification', () => {
    it('should show alternating colors along ranks', () => {
      const rank = 1;
      const colors = FILE_LETTERS.map((letter) => {
        const file = stringToFile(letter);
        return (file + rank) % 2;
      });
      // Should alternate: [dark(0), light(1), dark(0), light(1), dark(0), light(1)]
      // z1=0+1=1(light), a1=1+1=0(dark), b1=2+1=1(light), c1=3+1=0(dark), d1=4+1=1(light), e1=5+1=0(dark)
      expect(colors).toEqual([1, 0, 1, 0, 1, 0]);
    });

    it('should show alternating colors along files', () => {
      const file = stringToFile('a'); // file = 1
      const colors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rank) => {
        return (file + rank) % 2;
      });
      // a0=1+0=1(light), a1=1+1=0(dark), a2=1+2=1(light), a3=1+3=0(dark), ...
      expect(colors).toEqual([1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
    });

    it('should maintain same color along diagonals', () => {
      // Diagonal a1, b2, c3, d4
      const diagonal = [
        { file: stringToFile('a'), rank: 1 },
        { file: stringToFile('b'), rank: 2 },
        { file: stringToFile('c'), rank: 3 },
        { file: stringToFile('d'), rank: 4 },
      ];
      const colors = diagonal.map(({ file, rank }) => (file + rank) % 2);
      // a1=(1+1)%2=0, b2=(2+2)%2=0, c3=(3+3)%2=0, d4=(4+4)%2=0
      expect(colors).toEqual([0, 0, 0, 0]); // All same color
    });

    it('should maintain same color along anti-diagonals', () => {
      // Anti-diagonal a4, b3, c2, d1
      const antiDiagonal = [
        { file: stringToFile('a'), rank: 4 },
        { file: stringToFile('b'), rank: 3 },
        { file: stringToFile('c'), rank: 2 },
        { file: stringToFile('d'), rank: 1 },
      ];
      const colors = antiDiagonal.map(({ file, rank }) => (file + rank) % 2);
      // a4=(1+4)%2=1, b3=(2+3)%2=1, c2=(3+2)%2=1, d1=(4+1)%2=1
      expect(colors).toEqual([1, 1, 1, 1]); // All same color
    });
  });

  describe('Special edge cases', () => {
    it('should handle corner squares correctly', () => {
      // Bottom-left corner of main boards (a1)
      expect((stringToFile('a') + 1) % 2).toBe(0); // dark

      // Top-right corner of main boards (d8)
      expect((stringToFile('d') + 8) % 2).toBe(0); // dark

      // Attack board corners
      expect((stringToFile('z') + 0) % 2).toBe(0); // z0 dark
      expect((stringToFile('e') + 9) % 2).toBe(0); // e9 dark
    });

    it('should verify that opposite corners have same color (in 2D chess pattern)', () => {
      // In standard 2D chess, a1 and h8 are same color (dark)
      // In our system, we have a1W and d8B as main board corners
      const a1W = (stringToFile('a') + 1) % 2; // a1 = (1+1)%2 = 0 (dark)
      const d8B = (stringToFile('d') + 8) % 2; // d8 = (4+8)%2 = 0 (dark)
      expect(a1W).toBe(d8B);
    });
  });
});
