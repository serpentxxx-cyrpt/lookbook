export abstract class BaseSubpage {
  protected readonly page: HTMLDivElement;

  constructor(page: HTMLDivElement) {
    this.page = page;
  }

  public onEnter(): void {
    // noop;
  }

  public onShow(): void {
    // noop;
  }

  public onHide(): void {
    // noop;
  }

  public onExit(): void {
    // noop;
  }
}
