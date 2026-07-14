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

import { enableTouchControls } from './shared/utils/touchControls';
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

  // Determine cell size to fill both height and width without exceeding screen bounds
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 930;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1680;
  const isMobile = screenWidth < 768;

  let cellSize: number;
  let newWidth: number;
  const newHeight = originalHeight - 5; // 26 rows

  if (isMobile) {
    // On mobile: fill the available height below header exactly.
    // Header area ≈ 6px top pad + ~22px title + ~18px controls row + ~74px platformer canvas +
    //               ~26px control buttons + ~8px gaps = ~154px. Use 155 as safe estimate.
    // updateMobileHeaderBottom() corrects --header-bottom dynamically after first paint.
    const mobileHeaderHeight = 155;
    const availableH = screenHeight - mobileHeaderHeight;
    // Height-first: pick cellSize so newHeight * cellSize fills availableH
    const byHeight = Math.floor(availableH / newHeight);
    // Also must not exceed screen width with minimum ~19 columns
    const byWidth = Math.floor(screenWidth / 19);
    // Clamp to readable range
    cellSize = Math.max(13, Math.min(byHeight, byWidth, 22));
    newWidth = Math.floor(screenWidth / cellSize);
  } else {
    const maxAvailableHeight = screenHeight * 0.76;
    const maxHeightCell = Math.floor(maxAvailableHeight / newHeight);
    const maxWidthCell = Math.floor(screenWidth / newHeight);
    cellSize = Math.max(16, Math.min(maxHeightCell, maxWidthCell));
    newWidth = Math.floor(screenWidth / cellSize);
  }

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

  if (isMobile) {
    // On mobile: spread remaining 4 ghosts to maze corners so they aren't all clumped at centre.
    // Top-left area (avoid border walls, land on row 2-3, col 2-3)
    const tlX = 2;
    const tlY = 2;
    // Top-right area
    const trX = newWidth - 3;
    const trY = 2;
    // Bottom-left area
    const blX = 2;
    const blY = newHeight - 3;
    // Bottom-right area
    const brX = newWidth - 3;
    const brY = newHeight - 3;

    setEntityPosition(npcEntity5, (tlX + 0.5) * cellSize, (tlY + 0.5) * cellSize);
    npcEntity5.direction = Direction.right;

    setEntityPosition(npcEntity6, (trX + 0.5) * cellSize, (trY + 0.5) * cellSize);
    npcEntity6.direction = Direction.left;

    setEntityPosition(npcEntity7, (blX + 0.5) * cellSize, (blY + 0.5) * cellSize);
    npcEntity7.direction = Direction.right;

    setEntityPosition(npcEntity8, (brX + 0.5) * cellSize, (brY + 0.5) * cellSize);
    npcEntity8.direction = Direction.left;
  } else {
    // Desktop: Left/Right side spawns only if they fit on the screen
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
  }

  // Place Pacman outside the ghost house at row 17 (perfectly centered on grid tile)
  setEntityPosition(
    state.game.player,
    (midX + 0.5) * state.grid.cellSize,
    (17 + 0.5) * state.grid.cellSize,
  );
}

/**
 * On mobile, measure the actual bottom of the platformer menu after first paint
 * and set --header-bottom so .content starts right below it.
 */
function updateMobileHeaderBottom(): void {
  if (typeof window === 'undefined' || window.innerWidth >= 768) return;
  const platformerMenu = document.getElementById('platformer-menu');
  if (!platformerMenu) return;
  const rect = platformerMenu.getBoundingClientRect();
  const bottomPx = Math.ceil(rect.bottom) + 2; // 2px breathing room
  document.documentElement.style.setProperty('--header-bottom', `${bottomPx}px`);
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

    const target = (window as any).keyboardControlTarget || 'menu';
    if (target !== 'pacman') {
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
    const target = (window as any).keyboardControlTarget || 'menu';
    if (target === 'pacman') setPlayerDirection(state.game, Direction.up);
  });

  document.addEventListener('swiped-right', () => {
    const target = (window as any).keyboardControlTarget || 'menu';
    if (target === 'pacman') setPlayerDirection(state.game, Direction.right);
  });

  document.addEventListener('swiped-down', () => {
    const target = (window as any).keyboardControlTarget || 'menu';
    if (target === 'pacman') setPlayerDirection(state.game, Direction.down);
  });

  document.addEventListener('swiped-left', () => {
    const target = (window as any).keyboardControlTarget || 'menu';
    if (target === 'pacman') setPlayerDirection(state.game, Direction.left);
  });
}

function init(): void {
  initState();
  initEffects();
  initKeyPressEvents();

  initCanvas(injects);
  initPage(injects);

  initSwipeEvents();
  enableTouchControls();

  // Set mobile header bottom after first render frame so layout is complete
  requestAnimationFrame(() => {
    updateMobileHeaderBottom();
    // Re-check after a short delay in case fonts/images cause reflow
    setTimeout(updateMobileHeaderBottom, 300);
  });

  // Update on resize (orientation change, etc.)
  window.addEventListener('resize', updateMobileHeaderBottom);

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
