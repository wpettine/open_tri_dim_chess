import type { Piece } from '../store/gameStore';

export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 0;

  const createPiece = (
    type: Piece['type'],
    color: Piece['color'],
    file: number,
    rank: number,
    level: string
  ): Piece => ({
    id: `${color}-${type}-${idCounter++}`,
    type,
    color,
    file,
    rank,
    level,
    hasMoved: false,
  });

  const fileIndex = (ch: 'z' | 'a' | 'b' | 'c' | 'd' | 'e'): number => {
    switch (ch) {
      case 'z': return 0;
      case 'a': return 1;
      case 'b': return 2;
      case 'c': return 3;
      case 'd': return 4;
      case 'e': return 5;
    }
  };

  const mapLevel = (level: 'W' | 'B' | 'QL1' | 'KL1' | 'QL6' | 'KL6'): string => {
    if (level === 'W' || level === 'B') return level;
    if (level === 'QL1') return 'WQL';
    if (level === 'KL1') return 'WKL';
    if (level === 'QL6') return 'BQL';
    return 'BKL';
  };

  type JsonPiece = {
    type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
    color: 'white' | 'black';
    file: 'z' | 'a' | 'b' | 'c' | 'd' | 'e';
    rank: number;
    level: 'W' | 'B' | 'QL1' | 'KL1' | 'QL6' | 'KL6';
  };

  const jsonPieces: JsonPiece[] = [
    { type: 'rook',   color: 'white', file: 'z', rank: 0, level: 'QL1' },
    { type: 'queen',  color: 'white', file: 'a', rank: 0, level: 'QL1' },
    { type: 'pawn',   color: 'white', file: 'z', rank: 1, level: 'QL1' },
    { type: 'pawn',   color: 'white', file: 'a', rank: 1, level: 'QL1' },
    { type: 'king',   color: 'white', file: 'd', rank: 0, level: 'KL1' },
    { type: 'rook',   color: 'white', file: 'e', rank: 0, level: 'KL1' },
    { type: 'pawn',   color: 'white', file: 'd', rank: 1, level: 'KL1' },
    { type: 'pawn',   color: 'white', file: 'e', rank: 1, level: 'KL1' },
    { type: 'knight', color: 'white', file: 'a', rank: 1, level: 'W'   },
    { type: 'bishop', color: 'white', file: 'b', rank: 1, level: 'W'   },
    { type: 'bishop', color: 'white', file: 'c', rank: 1, level: 'W'   },
    { type: 'knight', color: 'white', file: 'd', rank: 1, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'a', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'b', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'c', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'd', rank: 2, level: 'W'   },
    { type: 'rook',   color: 'black', file: 'z', rank: 9, level: 'QL6' },
    { type: 'queen',  color: 'black', file: 'a', rank: 9, level: 'QL6' },
    { type: 'pawn',   color: 'black', file: 'z', rank: 8, level: 'QL6' },
    { type: 'pawn',   color: 'black', file: 'a', rank: 8, level: 'QL6' },
    { type: 'king',   color: 'black', file: 'd', rank: 9, level: 'KL6' },
    { type: 'rook',   color: 'black', file: 'e', rank: 9, level: 'KL6' },
    { type: 'pawn',   color: 'black', file: 'd', rank: 8, level: 'KL6' },
    { type: 'pawn',   color: 'black', file: 'e', rank: 8, level: 'KL6' },
    { type: 'knight', color: 'black', file: 'a', rank: 8, level: 'B'   },
    { type: 'bishop', color: 'black', file: 'b', rank: 8, level: 'B'   },
    { type: 'bishop', color: 'black', file: 'c', rank: 8, level: 'B'   },
    { type: 'knight', color: 'black', file: 'd', rank: 8, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'a', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'b', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'c', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'd', rank: 7, level: 'B'   },
  ];

  for (const jp of jsonPieces) {
    pieces.push(
      createPiece(
        jp.type,
        jp.color,
        fileIndex(jp.file),
        jp.rank,
        mapLevel(jp.level)
      )
    );
  }

  return pieces;
}
