# 🧩 Design Document: Scalable Save/Load System for Tri-Dimensional Chess Game

## 📌 Objective

Implement a local-first **save/load game state system** for a chess game that:

- Supports local play (e.g., human vs. human, human vs. AI)
- Persists multiple saved games using `localStorage`
- Can be easily extended to support cloud saving via Firebase (or other services)
- Follows a provider abstraction pattern for modularity

---

## 🗂️ File Structure Overview

src/
├── storage/
│ ├── storage.ts # Abstract interface
│ ├── localStorageProvider.ts # Local storage implementation
│ └── firebaseProvider.ts # Cloud (optional/future)
├── types/
│ └── GameData.ts # Game state types
├── hooks/
│ └── useAutoSave.ts # Debounced auto-save

css
Copy code

---

## 🧱 Game Data Format

Create a consistent JSON structure for a chess game save:

```ts
// types/GameData.ts

export interface GameData {
  id: string; // UUID or timestamp-based
  players: {
    white: string; // "Human", "AI", "Online", etc.
    black: string;
  };
  boardState: string;          // FEN-like or custom format
  moveHistory: string[];       // ["e4", "e5", "Nf3", ...]
  timestamp: number;           // Unix epoch time
  status: 'ongoing' | 'draw' | 'white_win' | 'black_win';
}
🔌 Abstract Storage Interface
Define a consistent interface to allow plug-and-play of different storage backends:

ts
Copy code
// storage/storage.ts

import { GameData } from '../types/GameData';

export interface GameStorageProvider {
  saveGame(data: GameData): Promise<void>;
  loadGame(id: string): Promise<GameData | null>;
  listGames(): Promise<GameData[]>;
  deleteGame(id: string): Promise<void>;
}
💾 LocalStorage Implementation
Use browser localStorage to persist data under a fixed key.

ts
Copy code
// storage/localStorageProvider.ts

const STORAGE_KEY = 'chess_saves';

export class LocalStorageProvider implements GameStorageProvider {
  async saveGame(data: GameData) {
    const games = await this.listGames();
    const filtered = games.filter(g => g.id !== data.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, data]));
  }

  async loadGame(id: string) {
    const games = await this.listGames();
    return games.find(g => g.id === id) || null;
  }

  async listGames() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async deleteGame(id: string) {
    const games = await this.listGames();
    const filtered = games.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}
🔜 Firebase Implementation (Future)
Use Firestore to persist and sync cloud saves.

ts
Copy code
// storage/firebaseProvider.ts

export class FirebaseStorageProvider implements GameStorageProvider {
  async saveGame(data: GameData) {
    await setDoc(doc(db, 'games', data.id), data);
  }

  async loadGame(id: string) {
    const snap = await getDoc(doc(db, 'games', id));
    return snap.exists() ? snap.data() as GameData : null;
  }

  async listGames() {
    const snaps = await getDocs(collection(db, 'games'));
    return snaps.docs.map(doc => doc.data() as GameData);
  }

  async deleteGame(id: string) {
    await deleteDoc(doc(db, 'games', id));
  }
}
⌛ Auto-Save Hook (Optional)
Use a debounced save to improve UX and prevent data loss:

ts
Copy code
// hooks/useAutoSave.ts

export function useAutoSave(game: GameData, provider: GameStorageProvider) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      provider.saveGame(game);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [game]);
}
🔧 Usage Example
ts
Copy code
const provider = new LocalStorageProvider();
// const provider = new FirebaseStorageProvider();

await provider.saveGame(currentGameState);
const loaded = await provider.loadGame('game_abc');
