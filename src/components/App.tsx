import React from 'react';

import { Board3D } from './Board3D/Board3D';
import { AttackBoardControls } from './UI/AttackBoardControls';

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Board3D />
      <AttackBoardControls />
      {/* Optional alternate pin list overlay */}
      {/* <RailPins /> */}
    </div>
  );
}
