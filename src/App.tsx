import { Board3D } from './components/Board3D/Board3D';
import { useGameStore } from './store/gameStore';
import { logWorldCoordinates } from './utils/debugLogger';
import { useEffect } from 'react';

function App() {
  const world = useGameStore(state => state.world);

  useEffect(() => {
    logWorldCoordinates(world);
  }, [world]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Board3D />
    </div>
  );
}

export default App;
