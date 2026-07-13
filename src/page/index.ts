import { config } from '../config';
import {
  pauseGameLoop,
  resumeGameLoop,
} from '../shared/state/game-loop/actions';
import { setEntityPosition, setNpcState } from '../shared/state/game/actions';
import { NpcState } from '../shared/state/game/types';
import { setCurrentRoute } from '../shared/state/route/actions';
import type { ApplicationInjects } from '../types';

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

  let currentRoute = normalizePath(window.location.pathname);
  let navigating = false;

  async function navigateWithTransition(
    target: string,
    pushState = true,
  ): Promise<void> {
    const normalizedTarget = normalizePath(target);
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
        window.history.pushState({}, '', normalizedTarget);
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

  setCurrentRoute(injects.state.route, normalizePath(window.location.pathname));
  applyRouteSideEffects(normalizePath(window.location.pathname));

  contentHandler.initialTransition();
  contentHandler.initialControllerShow();

  injects.router.setNavigate(navigateWithTransition);

  window.addEventListener('popstate', () => {
    navigateWithTransition(window.location.pathname, false);
  });

  function applyRouteSideEffects(path: string): void {
    const normalizedPath = normalizePath(path);
    if (normalizedPath === '/' || normalizedPath === '') {
      employerLink.setAttribute('tabindex', '0');
      floatingMenuHandler.enableLinks();
      fixedMenuHandler.enableLinks();

      resumeGameLoop(injects.state.gameLoop);

      if (injects.state.game.player.collision) {
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
    } else {
      employerLink.setAttribute('tabindex', '-1');
      floatingMenuHandler.disableLinks();
      fixedMenuHandler.disableLinks();

      pauseGameLoop(injects.state.gameLoop);

      document.body.classList.remove('has-menu-toggle');
    }
  }
}
