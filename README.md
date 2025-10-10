# Open Tri-Dimensional Chess

A web-based implementation of 3D Chess (Tri-Dimensional Chess) based on the Meder rules, built with React, TypeScript, Three.js, and Vite.

## About

This project implements a fully functional 3D chess game with:
- **3D board visualization** using Three.js
- **Complete rule validation** for piece movements across multiple levels
- **Attack board movement** system with passenger piece handling
- **Path validation** including vertical shadow constraints
- **Check and checkmate detection** (in progress)

The game follows the Meder rules for Tri-Dimensional Chess, featuring a main board with 64 squares across three levels and four movable attack boards that can transport pieces between different positions in 3D space.

## Getting Started

### Prerequisites

- Node.js v20.19+ (required for Vite 7 and @vitejs/plugin-react 5)
- npm or pnpm
### Installation

```bash
# Clone the repository
git clone https://github.com/wpettine/open_tri_dim_chess.git
cd open_tri_dim_chess

# Install dependencies
npm install
```

### Running the Game

Start the development server:

```bash
npm run dev
```

The game will be available at `http://localhost:5173` (or the next available port). The development server supports hot module reloading, so changes will be reflected automatically.

### Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run a specific test file:

```bash
npm test -- boardMovement.test.ts
```

### Code Quality

Lint the codebase:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Board3D/        # 3D board rendering with Three.js
│   └── UI/             # User interface components
├── engine/             # Chess game logic
│   ├── validation/     # Move and path validation
│   ├── world/          # World grid and board positions
│   └── initialSetup.ts # Initial piece placement
├── store/              # Zustand state management
└── config/             # Configuration and constants

reference_docs/         # Implementation guides and rules
├── ATTACK_BOARD_RULES.md      # Attack board movement rules
├── IMPLIMENTATION_GUIDE.md    # Detailed implementation guide
└── DEVIN_SCRATCH.md           # Development notes
```

## Implementation Progress

- ✅ **Phase 1-5**: World grid, piece initialization, coordinate system
- ✅ **Phase 6**: Move validation system (27 tests)
- ✅ **Phase 7**: Check & checkmate detection (15 tests)
- ✅ **Phase 8**: Attack board movement (20 tests) - Core game mechanics
- 🚧 **Phase 8**: Visual rendering and UI components (in progress)

Current test coverage: **58 passing tests**

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics rendering
- **Zustand** - State management
- **Vitest** - Testing framework
- **Vite** - Build tool and dev server
## Documentation

Detailed documentation is available in the `reference_docs/` directory:

- `ATTACK_BOARD_RULES.md` - Complete rules for attack board movement
- `IMPLIMENTATION_GUIDE.md` - Step-by-step implementation guide
- `DEVIN_SCRATCH.md` - Development notes and gotchas

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests
3. Ensure all tests pass: `npm test`
4. Ensure lint passes: `npm run lint`
5. Commit your changes with descriptive messages
6. Push and create a pull request

## License

This project is open source and available under the MIT License.
