import { reactive } from '@vue/reactivity';

import type { GridState } from './types';

export function createGridState(): GridState {
  return reactive<GridState>({
    width: 0,
    height: 0,
    cellSize: 0,
    cells: [],
    turningThreshold: 0,
    dotsRemaining: 0,
  });
}
