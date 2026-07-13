import type { ApplicationInjects } from '../../types';

export class LinksHandler {
  private readonly injects: ApplicationInjects;

  private readonly links: NodeListOf<HTMLAnchorElement>;

  private readonly navigate: (target: string) => void;

  constructor(
    injects: ApplicationInjects,
    links: NodeListOf<HTMLAnchorElement>,
    navigate?: (target: string) => void,
  ) {
    this.injects = injects;
    this.links = links;
    this.navigate =
      navigate ?? ((target: string) => this.injects.router.navigate(target));
  }

  public addEventHandlers(): void {
    this.links.forEach((link) => {
      link.addEventListener('click', (event: MouseEvent) => {
        const target = link.getAttribute('href');

        if (!target) {
          return;
        }

        event.preventDefault();
        this.navigate(target);
      });
    });
  }

  public enableLinks(): void {
    this.links.forEach((link) => {
      link.setAttribute('tabindex', '0');
    });
  }

  public disableLinks(): void {
    this.links.forEach((link) => {
      link.setAttribute('tabindex', '-1');
    });
  }
}
