import type { IPointData } from 'pixi.js';

import type {
  EntityState,
  NpcEntityState,
} from '../../shared/state/game/types';
import { NpcEntityColor, NpcState } from '../../shared/state/game/types';
import {
  setEntityPosition,
  setNpcState,
} from '../../shared/state/game/actions';
import { config } from '../../config';
import type { ApplicationInjects } from '../../types';
import type { BaseSubpage } from '../subpages/BaseSubpage';
import { getRelativePath, getAbsoluteUrl } from '../../shared/utils/routing';

type NavTransitionData = {
  route: string;
  position: IPointData;
  color: string;
};

export class ContentHandler {
  private static readonly fillMap: Record<NpcEntityColor, string> = {
    [NpcEntityColor.red]: '#ff0000',
    [NpcEntityColor.blue]: '#00ffde',
    [NpcEntityColor.pink]: '#ffb8de',
    [NpcEntityColor.orange]: '#ffb847',
  };

  /* eslint-disable @typescript-eslint/naming-convention */
  private static readonly controllersConstructorsMap: Record<
    string,
    new (page: HTMLDivElement) => BaseSubpage
  > = {
    // Example: '/portfolio': PortfolioSubpage,
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  private readonly controllersMap: Record<string, BaseSubpage> = {};

  private readonly injects: ApplicationInjects;

  private readonly navigate: (target: string) => void;

  private readonly contentWrapper: HTMLDivElement;

  private readonly transitionElement: HTMLDivElement;

  private readonly transitionElementPath: SVGPathElement;

  private readonly canvas: HTMLCanvasElement;

  private currentPage: HTMLDivElement | null = null;

  private currentPageController: BaseSubpage | null = null;

  private initialShowDone = false;

  private isFirstLoad = true;

  constructor(injects: ApplicationInjects, navigate: (target: string) => void) {
    this.injects = injects;
    this.navigate = navigate;

    const contentWrapper =
      document.querySelector<HTMLDivElement>('#content-wrapper');
    const transitionElement = document.querySelector<HTMLDivElement>(
      '#transition-element',
    );
    const transitionElementPath = document.querySelector<SVGPathElement>(
      '#transition-element-path',
    );
    const canvas = document.querySelector<HTMLCanvasElement>(
      '#canvas-app > canvas',
    );

    if (
      !contentWrapper ||
      !transitionElement ||
      !transitionElementPath ||
      !canvas
    ) {
      throw new Error(
        'ContentHandler: Required DOM elements not found. Ensure page structure is correct.',
      );
    }

    this.contentWrapper = contentWrapper;
    this.transitionElement = transitionElement;
    this.transitionElementPath = transitionElementPath;
    this.canvas = canvas;
  }

  public addEventHandlers(): void {
    this.contentWrapper.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const closeButton = target?.closest<HTMLAnchorElement>(
        '.subpage__close-button',
      );

      if (!closeButton) {
        return;
      }

      event.preventDefault();
      this.navigate('/');
    });
  }

  public initialTransition(): void {
    this.currentPage = this.getCurrentPage();

    if (this.currentPage) {
      const route = this.currentPage.getAttribute('data-route');
      this.ensureControllerForRoute(route, this.currentPage);

      if (route && route in this.controllersMap) {
        this.currentPageController = this.controllersMap[route];
        this.currentPageController.onEnter();
      }
    }

    const navData = this.getPendingNavTransition();
    const firstLoadSubpage =
      this.isFirstLoad &&
      this.currentPage &&
      this.normalizePath(getRelativePath(window.location.pathname)) !== '/';

    this.isFirstLoad = false;

    if (navData && this.currentPage) {
      this.initialRevealWithTransition(this.currentPage, navData);
      return;
    }

    if (firstLoadSubpage && this.currentPage) {
      this.initialRevealWithoutAnimation(this.currentPage);
      return;
    }

    this.immediateRevealPage(this.currentPage);
  }

  public initialControllerShow(): void {
    if (!this.currentPageController || this.initialShowDone) {
      return;
    }

    this.currentPageController.onShow();
    this.initialShowDone = true;
  }

  public async transitionPage(page: HTMLDivElement | null): Promise<void> {
    if (page === this.currentPage) {
      return;
    }

    await this.hideCurrentPage();

    if (page === null) {
      return;
    }

    await this.revealPage(page);
  }

  public async navigateTo(route: string): Promise<void> {
    const page = await this.ensurePage(route);

    if (route in ContentHandler.controllersConstructorsMap && page) {
      this.ensureControllerForRoute(route, page);
    }

    if (!(route in this.controllersMap)) {
      this.currentPageController = null;
    } else {
      this.currentPageController = this.controllersMap[route];
      this.currentPageController.onEnter();
    }

    const content = page?.querySelector('.subpage__content-wrapper');

    await this.transitionPage(page);

    if (content) {
      setTimeout(() => {
        content.scrollTo({ top: 0 });
      }, 60);
    }
  }

  public getTransitionPayload(targetRoute: string): NavTransitionData | null {
    const entity = this.getRelatedNpcEntity(targetRoute);

    if (!entity) {
      return null;
    }

    return {
      route: targetRoute,
      position: this.getEntityAbsolutePosition(entity),
      color: ContentHandler.fillMap[entity.color],
    };
  }

  private getCurrentPage(): HTMLDivElement | null {
    const currentPath = this.normalizePath(getRelativePath(window.location.pathname));

    if (!currentPath) {
      return null;
    }

    const pages = Array.from(
      this.contentWrapper.querySelectorAll<HTMLDivElement>(':scope > *'),
    );

    for (const page of pages) {
      const route = page.getAttribute('data-route');

      if (route === null) {
        continue;
      }

      if (this.normalizePath(route) === currentPath) {
        return page;
      }
    }

    return null;
  }

  private normalizePath(path: string): string {
    // Remove trailing slash for consistent matching (but keep "/" as is)
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path;
  }

  private async hideCurrentPage(): Promise<void> {
    if (!this.currentPage) {
      return;
    }

    if (this.currentPageController) {
      this.currentPageController.onExit();
    }

    const currentEntity = this.getRelatedNpcEntity(
      this.currentPage.getAttribute('data-route'),
    );

    if (!currentEntity) {
      this.transitionElement.style.transform = `translate(50vw, 50vw) scale(0)`;
      this.currentPage = null;

      return Promise.resolve();
    }

    const targetPosition = this.getEntityAbsolutePosition(currentEntity);

    const page = this.currentPage;

    this.transitionElement.style.transform = `translate(${targetPosition.x}px, ${targetPosition.y}px) scale(0)`;
    this.currentPage.style.opacity = '0';
    this.currentPage = null;

    setTimeout(() => {
      page.style.display = 'none';

      if (this.currentPageController) {
        this.currentPageController.onHide();
        this.currentPageController = null;
      }
    }, 300);

    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  private immediateRevealPage(page: HTMLDivElement | null): void {
    this.currentPage = page;

    const lastTransition = this.transitionElement.style.transition;
    this.transitionElement.style.transition = 'none';

    if (this.currentPage === null) {
      this.transitionElement.style.transform = 'translate(50vw, 50vh) scale(0)';
    } else {
      this.transitionElement.style.transform = 'translate(50vw, 50vh) scale(1)';
      this.currentPage.style.display = 'block';
      this.currentPage.style.opacity = '1';
    }

    setTimeout(() => {
      this.transitionElement.style.transition = lastTransition;
    });

    if (!this.currentPage) {
      return;
    }

    const currentEntity = this.getRelatedNpcEntity(
      this.currentPage.getAttribute('data-route'),
    )!;

    const targetTint = ContentHandler.fillMap[currentEntity.color];
    this.transitionElementPath.style.fill = targetTint;
  }

  private async revealPage(page: HTMLDivElement): Promise<void> {
    this.currentPage = page;

    const lastTransition = this.transitionElement.style.transition;

    const currentEntity = this.getRelatedNpcEntity(
      this.currentPage.getAttribute('data-route'),
    );

    if (!currentEntity) {
      return;
    }

    const targetPosition = this.getEntityAbsolutePosition(currentEntity);
    this.transitionElement.style.transition = `none`;
    this.transitionElement.style.transform = `translate(${targetPosition.x}px, ${targetPosition.y}px) scale(0)`;

    this.currentPage.style.opacity = '0';
    this.currentPage.style.display = 'block';

    const targetTint = ContentHandler.fillMap[currentEntity.color];
    this.transitionElementPath.style.fill = targetTint;

    return new Promise((resolve) => {
      setTimeout(() => {
        this.transitionElement.style.transition = lastTransition;
        this.transitionElement.style.transform = `translate(50vw, 50vh) scale(1)`;

        setTimeout(() => {
          if (this.currentPage) {
            this.currentPage.style.opacity = '1';
          }

          if (this.currentPageController) {
            this.currentPageController.onShow();
            this.initialShowDone = true;
          }

          const route = this.currentPage
            ? this.currentPage.getAttribute('data-route')
            : null;
          this.respawnNpcForRoute(route);
        }, 300);

        resolve();
      }, 50);
    });
  }

  private getRelatedNpcEntity(
    route: string | null,
  ): NpcEntityState | undefined {
    if (route === null) {
      return undefined;
    }

    const currentPageEntity = this.injects.state.game.npc.find((entity) => {
      return entity.route === route;
    });

    return currentPageEntity;
  }

  private getEntityAbsolutePosition(entity: EntityState): IPointData {
    const canvasRect = this.canvas.getBoundingClientRect();
    const grid = this.injects.state.grid;

    const canvasRatio = {
      x: canvasRect.width / (grid.cellSize * grid.width),
      y: canvasRect.height / (grid.cellSize * grid.height),
    };

    return {
      x: canvasRect.left + entity.x * canvasRatio.x,
      y: canvasRect.top + entity.y * canvasRatio.y,
    };
  }

  private getPendingNavTransition(): NavTransitionData | null {
    const raw = sessionStorage.getItem('navTransition');

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as NavTransitionData;

      if (
        this.normalizePath(parsed.route) !==
        this.normalizePath(getRelativePath(window.location.pathname))
      ) {
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Invalid nav transition data', error);
      return null;
    } finally {
      sessionStorage.removeItem('navTransition');
    }
  }

  private initialRevealWithTransition(
    page: HTMLDivElement,
    navData: NavTransitionData,
  ): void {
    this.currentPage = page;

    const lastTransition = this.transitionElement.style.transition;

    this.transitionElement.style.transition = 'none';
    this.transitionElement.style.transform = `translate(${navData.position.x}px, ${navData.position.y}px) scale(0)`;

    this.currentPage.style.opacity = '0';
    this.currentPage.style.display = 'block';

    this.transitionElementPath.style.fill = navData.color;

    setTimeout(() => {
      this.transitionElement.style.transition = lastTransition;
      this.transitionElement.style.transform = 'translate(50vw, 50vh) scale(1)';

      setTimeout(() => {
        if (this.currentPage) {
          this.currentPage.style.opacity = '1';
        }

        if (this.currentPageController) {
          this.currentPageController.onShow();
          this.initialShowDone = true;
        }

        const route = this.currentPage
          ? this.currentPage.getAttribute('data-route')
          : null;
        this.respawnNpcForRoute(route);
      }, 300);
    }, 50);
  }

  private respawnNpcForRoute(route: string | null): void {
    if (!route) {
      return;
    }

    const npc = this.getRelatedNpcEntity(route);

    if (!npc) {
      return;
    }

    setNpcState(npc, NpcState.respawning);

    const respawnXOffset = Math.random() >= 0.5 ? -0.5 : 0.5;
    const cellSize = this.injects.state.grid.cellSize;

    setEntityPosition(
      npc,
      (config.respawnLocation.x + respawnXOffset) * cellSize,
      config.respawnLocation.y * cellSize,
    );

    this.injects.state.game.player.collision = null;
  }

  private initialRevealWithoutAnimation(page: HTMLDivElement): void {
    this.currentPage = page;

    const lastTransition = this.transitionElement.style.transition;
    this.transitionElement.style.transition = 'none';
    this.transitionElement.style.transform = 'translate(50vw, 50vh) scale(1)';

    this.currentPage.style.display = 'block';
    this.currentPage.style.opacity = '1';

    const currentEntity = this.getRelatedNpcEntity(
      this.currentPage.getAttribute('data-route'),
    );

    if (currentEntity) {
      const targetTint = ContentHandler.fillMap[currentEntity.color];
      this.transitionElementPath.style.fill = targetTint;
    }

    setTimeout(() => {
      this.transitionElement.style.transition = lastTransition;
    });
  }

  private getPageByRoute(route: string): HTMLDivElement | null {
    if (!route || route === '/') {
      return null;
    }

    const pages =
      this.contentWrapper.querySelectorAll<HTMLDivElement>(':scope > *');

    for (const page of Array.from(pages)) {
      if (page.getAttribute('data-route') === route) {
        return page;
      }
    }

    return null;
  }

  private async ensurePage(route: string): Promise<HTMLDivElement | null> {
    if (!route || route === '/') {
      return null;
    }

    const existing = this.getPageByRoute(route);

    if (existing) {
      return existing;
    }

    const response = await fetch(getAbsoluteUrl(route), { credentials: 'same-origin' });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const wrapper = doc.querySelector('#content-wrapper');
    const subpage = wrapper?.querySelector<HTMLDivElement>(':scope > *');

    if (!subpage) {
      return null;
    }

    const cloned = subpage.cloneNode(true) as HTMLDivElement;
    this.contentWrapper.appendChild(cloned);

    return cloned;
  }

  private ensureControllerForRoute(
    route: string | null,
    page: HTMLDivElement | null,
  ): void {
    if (!route || !page) {
      return;
    }

    if (!(route in ContentHandler.controllersConstructorsMap)) {
      return;
    }

    if (route in this.controllersMap) {
      return;
    }

    this.controllersMap[route] = new ContentHandler.controllersConstructorsMap[
      route
    ](page);
  }
}
