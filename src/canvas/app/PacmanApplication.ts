import type { IApplicationOptions } from 'pixi.js';
import { Application } from 'pixi.js';

import type { AppRouter } from '../../shared/router';
import type { ApplicationState } from '../../shared/state/types';

export interface PacmanApplicationOptions extends IApplicationOptions {
  state: ApplicationState;
  router: AppRouter;
}

export class PacmanApplication extends Application {
  public readonly state: ApplicationState;

  public readonly router: AppRouter;

  constructor(options: PacmanApplicationOptions) {
    super(options);

    this.state = options.state;
    this.router = options.router;
  }
}
