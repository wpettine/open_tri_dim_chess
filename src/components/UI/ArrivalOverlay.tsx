import React from 'react';

export type ArrivalChoice = 'identity' | 'rot180';

export interface ArrivalOption {
  choice: ArrivalChoice;
  file: number;
  rank: number;
}

export function ArrivalOverlay({
  options,
  onConfirm,
  onCancel,
}: {
  options: ArrivalOption[];
  onConfirm: (choice: ArrivalChoice) => void;
  onCancel: () => void;
}) {
  return null;
}

export default ArrivalOverlay;
