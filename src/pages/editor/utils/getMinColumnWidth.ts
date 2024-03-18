// Returns the minWidth the gallery should be be able to shrink to, based
// on what the minimum column size in grid-container is
export function getMinColumnWidth(gridRule: string | null): number | null {
  if (gridRule) {
    const regex = /^repeat\(auto-fit, minmax\((.*?)px, 1fr\)\)$/;
    const result = gridRule.match(regex);
    if (result && result[1]) {
      return Number(result[1]);
    }
  }
  return null;
}
