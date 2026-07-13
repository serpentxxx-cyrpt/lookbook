import type { ApplicationInjects } from '../../types';

import { LinksHandler } from './LinksHandler';

export class FixedMenuHandler {
  private readonly menu: HTMLDivElement;

  private readonly links: NodeListOf<HTMLAnchorElement>;

  private readonly linksHandler: LinksHandler;

  constructor(injects: ApplicationInjects, navigate: (target: string) => void) {
    const menu = document.querySelector<HTMLDivElement>('#fixed-menu');

    if (!menu) {
      // Gracefully handle missing fixed menu (e.g. when replaced by platformer menu)
      this.menu = null as any;
      this.links = [] as any;
      this.linksHandler = null as any;
      return;
    }

    this.menu = menu;
    this.links = this.menu.querySelectorAll('a');

    this.linksHandler = new LinksHandler(injects, this.links, navigate);
  }

  public addMenuEventHandlers(): void {
    if (this.linksHandler) {
      this.linksHandler.addEventHandlers();
    }
  }

  public enableLinks(): void {
    if (this.linksHandler) {
      this.linksHandler.enableLinks();
    }
  }

  public disableLinks(): void {
    if (this.linksHandler) {
      this.linksHandler.disableLinks();
    }
  }
}
