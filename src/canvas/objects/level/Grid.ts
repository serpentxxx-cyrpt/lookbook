import type { ReactiveEffectRunner } from '@vue/reactivity';
import { effect, stop } from '@vue/reactivity';
import type { IDestroyOptions } from 'pixi.js';
import { Graphics, Container } from 'pixi.js';

import { config } from '../../../config';
import { CellType, WallType } from '../../../shared/state/grid/types';
import { getCell } from '../../../shared/state/helpers';
import type { PacmanApplication } from '../../app/PacmanApplication';

import { Dot } from './Dot';

type DrawFunction = (
  graphics: Graphics,
  x: number,
  y: number,
  cellSize: number,
) => void;

const wallDrawFunctions: Partial<Record<WallType, DrawFunction>> = {
  [WallType.horizontal]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo(x * cellSize, (y + 0.5) * cellSize);
    graphics.lineTo((x + 1) * cellSize, (y + 0.5) * cellSize);
  },
  [WallType.vertical]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo((x + 0.5) * cellSize, y * cellSize);
    graphics.lineTo((x + 0.5) * cellSize, (y + 1) * cellSize);
  },
  [WallType.cornerTopLeft]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo((x + 0.5) * cellSize, (y + 1) * cellSize);
    graphics.arcTo(
      (x + 0.5) * cellSize,
      (y + 0.5) * cellSize,
      (x + 1) * cellSize,
      (y + 0.5) * cellSize,
      cellSize / 2,
    );
  },
  [WallType.cornerTopRight]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo(x * cellSize, (y + 0.5) * cellSize);
    graphics.arcTo(
      (x + 0.5) * cellSize,
      (y + 0.5) * cellSize,
      (x + 0.5) * cellSize,
      (y + 1) * cellSize,
      cellSize / 2,
    );
  },
  [WallType.cornerBottomRight]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo((x + 0.5) * cellSize, y * cellSize);
    graphics.arcTo(
      (x + 0.5) * cellSize,
      (y + 0.5) * cellSize,
      x * cellSize,
      (y + 0.5) * cellSize,
      cellSize / 2,
    );
  },
  [WallType.cornerBottomLeft]: (
    graphics: Graphics,
    x: number,
    y: number,
    cellSize: number,
  ) => {
    graphics.moveTo((x + 0.5) * cellSize, y * cellSize);
    graphics.arcTo(
      (x + 0.5) * cellSize,
      (y + 0.5) * cellSize,
      (x + 1) * cellSize,
      (y + 0.5) * cellSize,
      cellSize / 2,
    );
  },
};

export class Grid extends Container {
  private readonly app: PacmanApplication;

  private readonly effects: ReactiveEffectRunner[] = [];

  private readonly graphics: Graphics;

  private readonly dots: Dot[] = [];

  constructor(app: PacmanApplication) {
    super();

    this.app = app;

    this.graphics = new Graphics();

    this.addChild(this.graphics);

    this.createDots();
    this.createEffects();
  }

  public destroy(options?: IDestroyOptions | boolean | undefined): void {
    this.effects.forEach((playerEffect) => {
      stop(playerEffect);
    });

    super.destroy(options);
  }

  private drawGrid(): void {
    const { width, height, cellSize } = this.app.state.grid;

    this.graphics.clear();
    this.graphics.lineStyle(config.wallThickness, config.wallColor);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cell = getCell(this.app.state.grid, x, y);

        if (!cell) {
          continue;
        }

        if (cell.type !== CellType.wall) {
          continue;
        }

        this.graphics.lineStyle(
          cell.thickness ?? config.wallThickness,
          cell.color ?? config.wallColor,
        );

        const drawFunction = wallDrawFunctions[cell.wallType];

        if (drawFunction) {
          drawFunction(this.graphics, x, y, cellSize);
        }

        this.graphics.endFill();
      }
    }
  }

  private createDots(): void {
    const { width, height } = this.app.state.grid;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cell = getCell(this.app.state.grid, x, y);

        if (!cell || cell.type !== CellType.empty) {
          continue;
        }

        const dot = new Dot(this.app, cell);
        dot.position.set(
          x * this.app.state.grid.cellSize,
          y * this.app.state.grid.cellSize,
        );

        this.addChild(dot);

        this.dots.push(dot);
      }
    }
  }

  private createEffects(): void {
    this.effects.push(
      effect(() => {
        this.drawGrid();
      }),
    );
  }
}
