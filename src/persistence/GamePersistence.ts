export interface SaveListEntry {
  id: string;
  name: string;
  updatedAt: string;
  source: 'local' | 'firebase';
}

export interface PersistedGameState {
  version: number;
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  payload: {
    pieces: Array<{
      id: string;
      type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
      color: 'white' | 'black';
      file: number;
      rank: number;
      level: string;
      hasMoved: boolean;
    }>;
    currentTurn: 'white' | 'black';
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    winner: 'white' | 'black' | null;
    gameOver: boolean;
    attackBoardPositions: Record<string, string>;
    moveHistory: Array<
      | {
          type: 'piece-move';
          from: string;
          to: string;
          piece: { type: string; color: 'white' | 'black' };
        }
      | {
          type: 'board-move';
          from: string;
          to: string;
          boardId: string;
          rotation?: number;
        }
    >;
    camera?: { currentView: 'default' | 'top' | 'side' | 'front' };
  };
  integrity?: {
    schemaVersion: number;
    checksum?: string;
  };
  meta?: {
    source: 'local' | 'firebase';
    userId?: string;
  };
}

export interface GamePersistence {
  listSaves(): Promise<SaveListEntry[]>;
  saveGame(entry: Omit<PersistedGameState, 'createdAt' | 'updatedAt' | 'id'> & Partial<Pick<PersistedGameState, 'id'>>): Promise<PersistedGameState>;
  loadGame(id: string): Promise<PersistedGameState | null>;
  deleteGame(id: string): Promise<void>;
  exportGame(id: string): Promise<string>;
  importGame(json: string): Promise<PersistedGameState>;
}
