import type { GameLoopState } from './types';

export function pauseGameLoop(state: GameLoopState): void {
  state.paused = true;
  state.lastPause = Date.now();
}

export function resumeGameLoop(state: GameLoopState): void {
  state.paused = false;
  state.lastResume = Date.now();
  state.lastPause = -1;
}
