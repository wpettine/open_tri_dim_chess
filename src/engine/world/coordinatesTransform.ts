export function translatePassenger(file: number, rank: number) {
  return { file, rank };
}

export function rotatePassenger180(relativeFile: number, relativeRank: number) {
  const newRelativeFile = 1 - relativeFile;
  const newRelativeRank = 1 - relativeRank;
  return { newRelativeFile, newRelativeRank };
}
