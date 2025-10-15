import { Board3D } from './components/Board3D/Board3D';
import { CameraControls } from './components/UI/CameraControls';
import CameraDebugOverlay from './components/UI/CameraDebugOverlay';
import { MoveHistory } from './components/UI/MoveHistory';
import GameStatus from './components/UI/GameStatus';
import { useGameStore } from './store/gameStore';
import { logWorldCoordinates } from './utils/debugLogger';
import { useEffect } from 'react';
import ArrivalOverlay from './components/UI/ArrivalOverlay';
import { THEME } from './config/theme';

function App() {
  const world = useGameStore(state => state.world);
  const interactionMode = useGameStore(state => state.interactionMode);
  const arrivalOptions = useGameStore(state => state.arrivalOptions) || [];
  const selectedBoardId = useGameStore(state => state.selectedBoardId);
  const selectedToPinId = useGameStore(state => state.selectedToPinId || null);
  const moveAttackBoard = useGameStore(state => state.moveAttackBoard);
  const clearArrivalSelection = useGameStore(state => state.clearArrivalSelection!);

  useEffect(() => {
    logWorldCoordinates(world);
  }, [world]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Board3D />
      <CameraControls />
      <CameraDebugOverlay defaultVisible={import.meta.env.DEV ? true : (THEME.debug?.cameraOverlayDefault ?? false)} />
      <MoveHistory />
      <GameStatus />
      {interactionMode === 'selectArrival' && selectedBoardId && selectedToPinId && (
        <ArrivalOverlay
          options={arrivalOptions}
          onConfirm={(choice) => {
            moveAttackBoard(selectedBoardId, selectedToPinId, false, choice);
            clearArrivalSelection();
          }}
          onCancel={() => {
            clearArrivalSelection();
          }}
        />
      )}
    </div>
  );
}

export default App;
