import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCameraDebugStore } from '../../store/cameraDebugStore';
import { THEME } from '../../config/theme';

interface CameraDebugOverlayProps {
  defaultVisible?: boolean;
}

export function CameraDebugOverlay({ defaultVisible = false }: CameraDebugOverlayProps) {
  const [visible, setVisible] = useState<boolean>(defaultVisible);
  const { position, target, up } = useCameraDebugStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const jsonPosition = useMemo(() => `[${position.join(', ')}]`, [position]);
  const jsonTarget = useMemo(() => `[${target.join(', ')}]`, [target]);
  const jsonUp = useMemo(() => `[${up.join(', ')}]`, [up]);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 120,
        left: 20,
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.4,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        zIndex: 101,
        maxWidth: 320,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong>Camera Tuning</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
          title="Hide (Ctrl+Alt+C)"
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div>position: {jsonPosition}</div>
        <button onClick={() => copy(jsonPosition)} style={{ marginTop: 4 }}>Copy position</button>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div>target: {jsonTarget}</div>
        <button onClick={() => copy(jsonTarget)} style={{ marginTop: 4 }}>Copy target</button>
      </div>

      <div>
        <div>up: {jsonUp}</div>
        <button onClick={() => copy(jsonUp)} style={{ marginTop: 4 }}>Copy up</button>
      </div>
    </div>
  );
}

export default CameraDebugOverlay;
