import { reactive } from '@vue/reactivity';

import { createGameLoopState } from './game-loop/state';
import { createGameState } from './game/state';
import { createGridState } from './grid/state';
import { createRouteState } from './route/state';
import type { ApplicationState } from './types';

export function createState(): ApplicationState {
  const route = createRouteState();
  const gameLoop = createGameLoopState();
  const game = createGameState();
  const grid = createGridState();

  return reactive<ApplicationState>({
    route,
    gameLoop,
    game,
    grid,
  });
}
