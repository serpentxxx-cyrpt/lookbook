import type { ReactiveEffectRunner } from '@vue/reactivity';
import { effect, stop } from '@vue/reactivity';
import type { IDestroyOptions } from 'pixi.js';
import { Graphics } from 'pixi.js';

import { config } from '../../../config';
import { DotType } from '../../../shared/state/grid/types';
import type { EmptyCell } from '../../../shared/state/grid/types';
import type { PacmanApplication } from '../../app/PacmanApplication';

export class Dot extends Graphics {
  protected readonly effects: ReactiveEffectRunner[] = [];

  protected readonly app: PacmanApplication;

  protected readonly cell: EmptyCell;

  constructor(app: PacmanApplication, cell: EmptyCell) {
    super();

    this.app = app;
    this.cell = cell;

    this.createEffects();
  }

  public destroy(options?: IDestroyOptions | boolean | undefined): void {
    this.effects.forEach((dotEffect) => {
      stop(dotEffect);
    });

    super.destroy(options);
  }

  protected createEffects(): void {
    this.effects.push(
      effect(() => {
        this.draw();
      }),
    );

    this.effects.push(
      effect(() => {
        this.visible = !this.cell.taken;
      }),
    );
  }

  private draw(): void {
    this.clear();
    this.beginFill(config.dotColor, 1);

    if (this.cell.dot === DotType.dot) {
      this.drawCircle(
        this.app.state.grid.cellSize / 2,
        this.app.state.grid.cellSize / 2,
        this.app.state.grid.cellSize / 8,
      );
    } else if (this.cell.dot === DotType.power) {
      this.drawCircle(
        this.app.state.grid.cellSize / 2,
        this.app.state.grid.cellSize / 2,
        this.app.state.grid.cellSize / 4,
      );
    }

    this.endFill();
  }
}
