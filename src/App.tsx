import { Board3D } from './components/Board3D/Board3D';
import { CameraControls } from './components/UI/CameraControls';
import { MoveHistory } from './components/UI/MoveHistory';
import { GameStatus } from './components/UI/GameStatus';
import { useGameStore } from './store/gameStore';
import { logWorldCoordinates } from './utils/debugLogger';
import { useEffect } from 'react';

function App() {
  const world = useGameStore(state => state.world);

  useEffect(() => {
    logWorldCoordinates(world);
  }, [world]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Board3D />
      <CameraControls />
      <MoveHistory />
      <GameStatus />
    </div>
  );
}

export default App;
