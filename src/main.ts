import './styles/style.scss';

import 'swiped-events';
import { effect } from '@vue/reactivity';

import { init as initCanvas } from './canvas';
import { config } from './config';
import { init as initPage } from './page';
import map from './resources/map.json';
import { generateMaze } from './mazeGenerator';
import { createRouter } from './shared/router';
import { createState } from './shared/state';
import {
  setPlayerDirection,
  tickApplication,
} from './shared/state/actions';
import { registerNpc, setEntityPosition } from './shared/state/game/actions';
import { Direction, NpcEntityColor } from './shared/state/game/types';
import { createGrid, setCellsValues, restoreTakenDots } from './shared/state/grid/actions';

import { createTicker } from './shared/ticker';
import type { ApplicationInjects } from './types';

const state = createState();
const router = createRouter();
const ticker = createTicker();

const injects: ApplicationInjects = {
  state,
  router,
  ticker,
};

function initState(): void {
  const originalHeight = map.height;

  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 930;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1680;

  // We scale the cell size to fit the content container height (82vh, using 76% of screen height for safety)
  const maxAvailableHeight = screenHeight * 0.76;
  const cellSize = Math.max(16, Math.floor(maxAvailableHeight / (originalHeight - 5)));
  const newWidth = Math.floor(screenWidth / cellSize);
  const newHeight = originalHeight - 5; // 26 rows
  const midX = Math.floor(newWidth / 2);

  // Update config respawn location coordinates to match the centered grid offset.
  config.respawnLocation.x = midX;
  config.respawnLocation.y = 9.5;
  config.respawnEndLocations = [
    { x: midX - 1, y: 7 },
    { x: midX, y: 7 },
  ];

  createGrid(state.grid, newWidth, newHeight, cellSize, 3);

  // Generate procedural widescreen maze
  const newCells = generateMaze(newWidth, newHeight, config);

  setCellsValues(state.grid, newCells);

  // Restore taken dots flag to false across all empty cells so left/right sections have dots visible
  restoreTakenDots(state.grid);

  const npcEntity1 = registerNpc(
    state.game,
    'npc1',
    NpcEntityColor.red,
    '/about',
  );
  const npcEntity2 = registerNpc(
    state.game,
    'npc2',
    NpcEntityColor.pink,
    '/portfolio',
  );
  const npcEntity3 = registerNpc(
    state.game,
    'npc3',
    NpcEntityColor.orange,
    '/contact',
  );
  const npcEntity4 = registerNpc(
    state.game,
    'npc4',
    NpcEntityColor.blue,
    '/resume',
  );
  const npcEntity5 = registerNpc(
    state.game,
    'npc5',
    NpcEntityColor.red,
    '/about',
  );
  const npcEntity6 = registerNpc(
    state.game,
    'npc6',
    NpcEntityColor.pink,
    '/portfolio',
  );
  const npcEntity7 = registerNpc(
    state.game,
    'npc7',
    NpcEntityColor.orange,
    '/contact',
  );
  const npcEntity8 = registerNpc(
    state.game,
    'npc8',
    NpcEntityColor.blue,
    '/resume',
  );

  // Center Ghost House Spawn Setups (perfectly centered on grid tiles)
  setEntityPosition(npcEntity1, (midX + 0.5) * cellSize, (7 + 0.5) * cellSize);
  npcEntity1.direction = Direction.left;

  setEntityPosition(npcEntity2, (midX + 0.5) * cellSize, (9 + 0.5) * cellSize);
  npcEntity2.direction = Direction.down;

  setEntityPosition(npcEntity3, (midX - 1 + 0.5) * cellSize, (9 + 0.5) * cellSize);
  npcEntity3.direction = Direction.up;

  setEntityPosition(npcEntity4, (midX + 1 + 0.5) * cellSize, (9 + 0.5) * cellSize);
  npcEntity4.direction = Direction.up;

  // Left/Right side spawns only if they fit on the screen
  const hasLeftSpace = (midX - 26) >= 2;
  const hasRightSpace = (midX + 26) < newWidth - 2;

  if (hasLeftSpace) {
    setEntityPosition(npcEntity5, (midX - 26 + 0.5) * cellSize, (7 + 0.5) * cellSize);
    npcEntity5.direction = Direction.right;
    setEntityPosition(npcEntity6, (midX - 26 + 0.5) * cellSize, (9 + 0.5) * cellSize);
    npcEntity6.direction = Direction.down;
  } else {
    setEntityPosition(npcEntity5, (midX - 1 + 0.5) * cellSize, (7 + 0.5) * cellSize);
    npcEntity5.direction = Direction.right;
    setEntityPosition(npcEntity6, (midX - 1 + 0.5) * cellSize, (9 + 0.5) * cellSize);
    npcEntity6.direction = Direction.down;
  }

  if (hasRightSpace) {
    setEntityPosition(npcEntity7, (midX + 26 + 0.5) * cellSize, (7 + 0.5) * cellSize);
    npcEntity7.direction = Direction.left;
    setEntityPosition(npcEntity8, (midX + 26 + 0.5) * cellSize, (9 + 0.5) * cellSize);
    npcEntity8.direction = Direction.up;
  } else {
    setEntityPosition(npcEntity7, (midX + 1 + 0.5) * cellSize, (7 + 0.5) * cellSize);
    npcEntity7.direction = Direction.left;
    setEntityPosition(npcEntity8, (midX + 1 + 0.5) * cellSize, (9 + 0.5) * cellSize);
    npcEntity8.direction = Direction.up;
  }

  // Place Pacman outside the ghost house at row 17 (perfectly centered on grid tile)
  setEntityPosition(
    state.game.player,
    (midX + 0.5) * state.grid.cellSize,
    (17 + 0.5) * state.grid.cellSize,
  );
}

function initEffects(): void {
  effect(() => {
    const playerCollision = state.game.player.collision;

    if (playerCollision === null) {
      return;
    }

    router.navigate(playerCollision.route);
  });

  // Listen for platformer menu navigation events
  window.addEventListener('platformer-navigate', (e: Event) => {
    const route = (e as CustomEvent<{ route: string }>).detail?.route;
    if (route) router.navigate(route);
  });
}

function initKeyPressEvents(): void {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.location.pathname !== router.root) {
      router.navigate('/');
    }

    if (state.gameLoop.paused) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        setPlayerDirection(state.game, Direction.up);
        break;
      case 'ArrowDown':
        setPlayerDirection(state.game, Direction.down);
        break;
      case 'ArrowLeft':
        setPlayerDirection(state.game, Direction.left);
        break;
      case 'ArrowRight':
        setPlayerDirection(state.game, Direction.right);
        break;
    }
  });
}

function initSwipeEvents(): void {
  document.addEventListener('swiped-up', () => {
    setPlayerDirection(state.game, Direction.up);
  });

  document.addEventListener('swiped-right', () => {
    setPlayerDirection(state.game, Direction.right);
  });

  document.addEventListener('swiped-down', () => {
    setPlayerDirection(state.game, Direction.down);
  });

  document.addEventListener('swiped-left', () => {
    setPlayerDirection(state.game, Direction.left);
  });
}

function init(): void {
  initState();
  initEffects();
  initKeyPressEvents();

  initCanvas(injects);
  initPage(injects);

  initSwipeEvents();

  ticker.add((deltaTime: number) => {
    if (state.gameLoop.paused) {
      return;
    }

    if (
      Date.now() - state.gameLoop.lastResume <
      config.pageTransitionDuration
    ) {
      return;
    }

    tickApplication(state, deltaTime);
  });
}

init();
