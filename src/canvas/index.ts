import { Container } from 'pixi.js';

import { config } from '../config';
import type { ApplicationInjects } from '../types';

import { PacmanApplication } from './app/PacmanApplication';
import { AssetsLoader } from './loaders/AssetsLoader';
import { Ghost } from './objects/entities/Ghost';
import { Pacman } from './objects/entities/Pacman';
import { Grid } from './objects/level/Grid';

export async function init({
  state,
  ticker,
  router,
}: ApplicationInjects): Promise<void> {
  const tileSize = state.grid.cellSize;
  const width = state.grid.width * tileSize;
  const height = state.grid.height * tileSize;

  const app = new PacmanApplication({
    state,
    router,
    width,
    height,
    antialias: true,
    backgroundAlpha: 1,
    resolution: 1,
    autoStart: false,
  });

  (app as any).customTicker = ticker;

  const wrapper = document.querySelector('#canvas-app');

  if (!wrapper) {
    return;
  }

  wrapper.appendChild(app.view);

  await AssetsLoader.load();

  ticker.add(() => {
    if (
      state.gameLoop.paused &&
      Date.now() - state.gameLoop.lastPause > config.pageTransitionDuration
    ) {
      return;
    }

    app.render();
  });

  const gameContainer = new Container();

  const grid = new Grid(app);
  gameContainer.addChild(grid);

  const player = new Pacman(app, state.game.player);
  gameContainer.addChild(player);

  for (const npc of state.game.npc) {
    const ghost = new Ghost(app, npc);
    gameContainer.addChild(ghost);
  }

  document.oncontextmenu = function (event): boolean {
    event.preventDefault();
    event.stopPropagation();

    return false;
  };

  app.stage.addChild(gameContainer);
}
