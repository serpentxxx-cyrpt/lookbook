import type { GameLoopState } from './game-loop/types';
import type { GameState } from './game/types';
import type { GridState } from './grid/types';
import type { RouteState } from './route/types';

export interface ApplicationState {
  route: RouteState;
  gameLoop: GameLoopState;
  game: GameState;
  grid: GridState;
}
