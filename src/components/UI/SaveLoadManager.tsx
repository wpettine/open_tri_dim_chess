import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LocalStoragePersistence } from '../../persistence/localStoragePersistence';
import { useGameStore } from '../../store/gameStore';
import './SaveLoadManager.css';

type Mode = 'save' | 'load';

interface Props {
  open: boolean;
  mode: Mode;
  onClose: () => void;
}

export default function SaveLoadManager({ open, mode, onClose }: Props) {
  const [saves, setSaves] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const persistence = useMemo(() => new LocalStoragePersistence(), []);

  const refresh = useCallback(async () => {
    const list = await persistence.listSaves();
    setSaves(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    if (list.length > 0) setSelectedId(list[0].id);
    else setSelectedId(null);
  }, [persistence]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  async function handlePrimary() {
    try {
      setBusy(true);
      if (mode === 'save') {
        const n = name.trim() || 'Manual Save';
        await useGameStore.getState().saveCurrentGame(n);
        await refresh();
        setName('');
      } else {
        if (!selectedId) return;
        await useGameStore.getState().loadGameById(selectedId);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved game?')) return;
    setBusy(true);
    try {
      await useGameStore.getState().deleteGameById(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(id: string) {
    const json = await useGameStore.getState().exportGameById(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otdc-save-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const json = ev.target?.result as string;
          await useGameStore.getState().importGameFromJson(json);
          await refresh();
        } catch (err) {
          alert('Failed to import: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  if (!open) return null;

  return (
    <div className="slm-backdrop" onClick={onClose}>
      <div className="slm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="slm-header">
          <h3>{mode === 'save' ? 'Save Game' : 'Load Game'}</h3>
          <button className="slm-close" onClick={onClose}>×</button>
        </div>

        {mode === 'save' && (
          <div className="slm-save-row">
            <input
              className="slm-input"
              placeholder="Save name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="slm-primary" disabled={busy} onClick={handlePrimary}>
              Save
            </button>
          </div>
        )}

        <div className="slm-list">
          {saves.length === 0 ? (
            <div className="slm-empty">No saved games yet</div>
          ) : (
            saves.map((s) => (
              <div
                key={s.id}
                className={'slm-item ' + (selectedId === s.id ? 'selected' : '')}
                onClick={() => setSelectedId(s.id)}
              >
                <div className="slm-item-main">
                  <div className="slm-name">{s.name}</div>
                  <div className="slm-date">{new Date(s.updatedAt).toLocaleString()}</div>
                </div>
                <div className="slm-actions">
                  <button className="slm-action" onClick={(e) => { e.stopPropagation(); void handleExport(s.id); }}>Export</button>
                  <button className="slm-action danger" onClick={(e) => { e.stopPropagation(); void handleDelete(s.id); }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="slm-footer">
          <div className="slm-left">
            <button className="slm-secondary" onClick={handleImport}>Import from File</button>
          </div>
          {mode === 'load' && (
            <button className="slm-primary" disabled={busy || !selectedId} onClick={handlePrimary}>
              Load Selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
