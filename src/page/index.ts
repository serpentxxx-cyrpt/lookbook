import { config } from '../config';
import {
  pauseGameLoop,
  resumeGameLoop,
} from '../shared/state/game-loop/actions';
import { setEntityPosition, setNpcState } from '../shared/state/game/actions';
import { NpcState } from '../shared/state/game/types';
import { setCurrentRoute } from '../shared/state/route/actions';
import type { ApplicationInjects } from '../types';
import { getRelativePath, getAbsoluteUrl } from '../shared/utils/routing';
import { playCollisionSound } from '../shared/utils/sound';

import { ContentHandler } from './handlers/ContentHandler';
import { FixedMenuHandler } from './handlers/FixedMenuHandler';
import { FloatingMenuHandler } from './handlers/FloatingMenuHandler';

export function init(injects: ApplicationInjects): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const employerLink = document.querySelector('#employer-link')!;
  let contentHandler: ContentHandler;

  function normalizePath(path: string): string {
    // Remove trailing slash for consistent matching (but keep "/" as is)
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path;
  }

  let currentRoute = normalizePath(getRelativePath(window.location.pathname));
  let navigating = false;

  async function navigateWithTransition(
    target: string,
    pushState = true,
  ): Promise<void> {
    const normalizedTarget = normalizePath(getRelativePath(target));
    if (!normalizedTarget || normalizedTarget === currentRoute || navigating) {
      return;
    }

    navigating = true;

    try {
      const payload = contentHandler?.getTransitionPayload(normalizedTarget);

      if (payload) {
        sessionStorage.setItem('navTransition', JSON.stringify(payload));
      }

      await contentHandler.navigateTo(normalizedTarget);

      if (pushState) {
        window.history.pushState({}, '', getAbsoluteUrl(normalizedTarget));
      }

      currentRoute = normalizedTarget;
      setCurrentRoute(injects.state.route, normalizedTarget);
      applyRouteSideEffects(normalizedTarget);
    } finally {
      navigating = false;
    }
  }

  contentHandler = new ContentHandler(injects, navigateWithTransition);
  const floatingMenuHandler = new FloatingMenuHandler(
    injects,
    navigateWithTransition,
  );
  const fixedMenuHandler = new FixedMenuHandler(
    injects,
    navigateWithTransition,
  );

  floatingMenuHandler.addMenuEventHandlers();
  fixedMenuHandler.addMenuEventHandlers();
  contentHandler.addEventHandlers();

  setCurrentRoute(injects.state.route, normalizePath(getRelativePath(window.location.pathname)));
  applyRouteSideEffects(normalizePath(getRelativePath(window.location.pathname)));

  contentHandler.initialTransition();
  contentHandler.initialControllerShow();

  injects.router.setNavigate(navigateWithTransition);

  window.addEventListener('popstate', () => {
    navigateWithTransition(getRelativePath(window.location.pathname), false);
  });

  // ── Pause overlay helper ──────────────────────────────────────────
  function updatePauseOverlay(): void {
    const overlay = document.getElementById('maze-pause-overlay');
    const target = (window as any).keyboardControlTarget || 'menu';
    const normalizedPath = normalizePath(getRelativePath(window.location.pathname));
    const isHomePage = normalizedPath === '/' || normalizedPath === '';

    if (isHomePage && target === 'menu') {
      // Pause the game loop and show overlay
      pauseGameLoop(injects.state.gameLoop);
      if (overlay) overlay.style.display = 'flex';
    } else if (isHomePage && target === 'pacman') {
      // Resume the game loop and hide overlay
      resumeGameLoop(injects.state.gameLoop);
      if (overlay) overlay.style.display = 'none';
    } else {
      // On subpages, always hide overlay (game is paused by subpage logic)
      if (overlay) overlay.style.display = 'none';
    }
  }

  // Listen for toggle changes
  window.addEventListener('keyboard-target-change', () => {
    updatePauseOverlay();
  });

  function applyRouteSideEffects(path: string): void {
    const normalizedPath = normalizePath(path);
    if (normalizedPath === '/' || normalizedPath === '') {
      employerLink.setAttribute('tabindex', '0');
      floatingMenuHandler.enableLinks();
      fixedMenuHandler.enableLinks();

      // Only resume if pacman mode is active; otherwise keep paused
      const target = (window as any).keyboardControlTarget || 'menu';
      if (target === 'pacman') {
        resumeGameLoop(injects.state.gameLoop);
      } else {
        pauseGameLoop(injects.state.gameLoop);
      }

      if (injects.state.game.player.collision) {
        playCollisionSound();
        setNpcState(injects.state.game.player.collision, NpcState.respawning);

        const respawnXOffset = Math.random() >= 0.5 ? -0.5 : 0.5;

        setEntityPosition(
          injects.state.game.player.collision,
          (config.respawnLocation.x + respawnXOffset) *
            injects.state.grid.cellSize,
          config.respawnLocation.y * injects.state.grid.cellSize,
        );

        injects.state.game.player.collision = null;
      }

      document.body.classList.add('has-menu-toggle');

      // Sync pause overlay
      updatePauseOverlay();
    } else {
      employerLink.setAttribute('tabindex', '-1');
      floatingMenuHandler.disableLinks();
      fixedMenuHandler.disableLinks();

      pauseGameLoop(injects.state.gameLoop);

      // Hide overlay on subpages
      const overlay = document.getElementById('maze-pause-overlay');
      if (overlay) overlay.style.display = 'none';

      document.body.classList.remove('has-menu-toggle');
    }
  }
}
