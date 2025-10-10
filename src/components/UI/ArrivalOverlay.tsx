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
  void options;
  void onConfirm;
  void onCancel;
  return null;
}

export default ArrivalOverlay;
