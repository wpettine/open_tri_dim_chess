import React from 'react';
import { useCameraStore } from '../../store/cameraStore';
import './CameraControls.css';

export function CameraControls() {
  const { currentView, setView } = useCameraStore();

  return (
    <div className="camera-controls">
      <h4>Camera View</h4>
      <div className="camera-buttons">
        <button
          className={currentView === 'default' ? 'active' : ''}
          onClick={() => setView('default')}
        >
          Default
        </button>
        <button
          className={currentView === 'top' ? 'active' : ''}
          onClick={() => setView('top')}
        >
          Top
        </button>
        <button
          className={currentView === 'side' ? 'active' : ''}
          onClick={() => setView('side')}
        >
          Side
        </button>
        <button
          className={currentView === 'front' ? 'active' : ''}
          onClick={() => setView('front')}
        >
          Front
        </button>
      </div>
    </div>
  );
}
