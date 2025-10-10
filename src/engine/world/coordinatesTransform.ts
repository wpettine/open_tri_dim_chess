export function translatePassenger(file: number, rank: number) {
  return { file, rank };
}

export function rotatePassenger180(relativeFile: number, relativeRank: number) {
  const newRelativeFile = 1 - relativeFile;
  const newRelativeRank = 1 - relativeRank;
  return { newRelativeFile, newRelativeRank };
}

export type ArrivalChoice = 'identity' | 'rot180';

export interface ArrivalInput {
  track: 'QL' | 'KL';
  fromPin: number;
  toPin: number;
  fromRotation: 0 | 180;
  toRotation: 0 | 180;
  localFile: number;
  localRank: number;
}

export interface ArrivalResult {
  file: number;
  rank: number;
}

const RANK_OFFSET_BY_PIN: Record<number, number> = { 1: 0, 2: 4, 3: 2, 4: 6, 5: 4, 6: 8 };

export function calculateArrivalCoordinates(input: ArrivalInput, choice: ArrivalChoice): ArrivalResult {
  const baseFile = input.track === 'QL' ? 0 : 4;
  const toRankOffset = RANK_OFFSET_BY_PIN[input.toPin];

  let destLocalFile = input.localFile;
  let destLocalRank = input.localRank;
  if (choice === 'rot180') {
    destLocalFile = 1 - destLocalFile;
    destLocalRank = 1 - destLocalRank;
  }

  const files = input.toRotation === 0 ? [baseFile, baseFile + 1] : [baseFile + 1, baseFile];
  const ranks = input.toRotation === 0 ? [toRankOffset, toRankOffset + 1] : [toRankOffset + 1, toRankOffset];

  return {
    file: files[destLocalFile],
    rank: ranks[destLocalRank],
  };
}

export function getArrivalOptions(
  track: 'QL' | 'KL',
  fromPin: number,
  toPin: number,
  fromRotation: 0 | 180,
  toRotation: 0 | 180,
  localFile: number,
  localRank: number
): Array<{ choice: ArrivalChoice; file: number; rank: number }> {
  const choices: ArrivalChoice[] = ['identity', 'rot180'];
  return choices.map((choice) => {
    const coords = calculateArrivalCoordinates(
      { track, fromPin, toPin, fromRotation, toRotation, localFile, localRank },
      choice
    );
    return { choice, file: coords.file, rank: coords.rank };
  });
}
