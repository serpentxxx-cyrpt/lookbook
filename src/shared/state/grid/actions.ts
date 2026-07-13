import type { Cell, GridState } from './types';
import { DotType, CellType } from './types';

export function createGrid(
  state: GridState,
  width: number,
  height: number,
  cellSize: number,
  turningThreshold: number,
): void {
  state.width = width;
  state.height = height;
  state.cellSize = cellSize;
  state.turningThreshold = turningThreshold;

  state.cells = Array.from({ length: width * height }, () => {
    return {
      type: CellType.empty,
      dot: DotType.never,
      taken: true,
    };
  });
}

export function setCellsValues(state: GridState, value: Cell[]): void {
  state.cells = value;
  state.dotsRemaining = value.filter((cell) => {
    if (cell.type !== CellType.empty) {
      return false;
    }

    return (
      (cell.dot === DotType.power || cell.dot === DotType.dot) && !cell.taken
    );
  }).length;
}

export function restoreTakenDots(state: GridState): void {
  let dotsRemaining = 0;

  for (const cell of state.cells) {
    if (cell.type !== CellType.empty) {
      continue;
    }

    cell.taken = false;
    dotsRemaining++;
  }

  state.dotsRemaining = dotsRemaining;
}
