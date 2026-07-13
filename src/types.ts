import type { IPointData, Ticker } from 'pixi.js';

import type { ApplicationState } from './shared/state/types';
import type { AppRouter } from './shared/router';

export interface ApplicationInjects {
  state: ApplicationState;
  router: AppRouter;
  ticker: Ticker;
}

export interface GameConfig {
  playerSpeed: number;
  wallColor: number;
  wallThickness: number;
  dotColor: number;
  pickDistance: number;
  collisionDistance: number;
  pageTransitionDuration: number;
  respawnLocation: IPointData;
  respawnEndLocations: IPointData[];
  ghostDirectionChangeLikelihood: number;
  deltaTimeDivisor: number;
}
