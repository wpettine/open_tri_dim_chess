import { z } from 'zod';

export const SCHEMA_VERSION = 1;

export const PieceSchema = z.object({
  id: z.string(),
  type: z.enum(['pawn', 'rook', 'knight', 'bishop', 'queen', 'king']),
  color: z.enum(['white', 'black']),
  file: z.number().int(),
  rank: z.number().int(),
  level: z.string(),
  hasMoved: z.boolean(),
});

const PieceMoveSchema = z.object({
  type: z.literal('piece-move'),
  from: z.string(),
  to: z.string(),
  piece: z.object({
    type: z.string(),
    color: z.enum(['white', 'black']),
  }),
});

const BoardMoveSchema = z.object({
  type: z.literal('board-move'),
  from: z.string(),
  to: z.string(),
  boardId: z.string(),
  rotation: z.number().int().optional(),
});

export const MoveSchema = z.union([PieceMoveSchema, BoardMoveSchema]);

export const PayloadSchema = z.object({
  pieces: z.array(PieceSchema),
  currentTurn: z.enum(['white', 'black']),
  isCheck: z.boolean(),
  isCheckmate: z.boolean(),
  isStalemate: z.boolean(),
  winner: z.union([z.enum(['white', 'black']), z.null()]),
  gameOver: z.boolean(),
  attackBoardPositions: z.record(z.string(), z.string()),
  moveHistory: z.array(MoveSchema),
  camera: z
    .object({
      currentView: z.enum(['default', 'top', 'side', 'front']),
    })
    .optional(),
});

export const PersistedGameStateSchema = z.object({
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.string(),
  name: z.string(),
  payload: PayloadSchema,
  integrity: z
    .object({
      schemaVersion: z.number().int(),
      checksum: z.string().optional(),
    })
    .optional(),
  meta: z
    .object({
      source: z.enum(['local', 'firebase']),
      userId: z.string().optional(),
    })
    .optional(),
});

export type PersistedGameState = z.infer<typeof PersistedGameStateSchema>;
