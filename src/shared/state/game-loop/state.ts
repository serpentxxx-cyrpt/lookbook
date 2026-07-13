import { reactive } from '@vue/reactivity';

import type { GameLoopState } from './types';

export function createGameLoopState(): GameLoopState {
  return reactive<GameLoopState>({
    lastPause: -1,
    lastResume: -1,
    paused: false,
  });
}
