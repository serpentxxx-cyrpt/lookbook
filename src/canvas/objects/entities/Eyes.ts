import type { IPointData } from 'pixi.js';
import { Container, Graphics } from 'pixi.js';

import { Direction } from '../../../shared/state/game/types';

function generateEyeballsGraphics(eyeSeparation = 4): Graphics {
  const halfSeparation = eyeSeparation / 2;

  const graphics = new Graphics();

  graphics.beginFill(0xffffff);
  graphics.drawRect(-halfSeparation - 16, -10, 8, 20);
  graphics.drawRect(-halfSeparation - 20, -6, 16, 12);

  graphics.drawRect(halfSeparation + 4, -10, 8, 20);
  graphics.drawRect(halfSeparation, -6, 16, 12);

  return graphics;
}

function generatePupilsGraphics(eyeSeparation = 4): Graphics {
  const halfSeparation = eyeSeparation / 2;

  const graphics = new Graphics();

  graphics.beginFill(0x0000ff);
  graphics.drawRect(-halfSeparation - 16, -4, 8, 8);
  graphics.drawRect(-halfSeparation + 8, -4, 8, 8);

  return graphics;
}

export class Eyes extends Container {
  private static readonly pupilsPositions: Record<Direction, IPointData> = {
    [Direction.none]: { x: 0, y: 0 },
    [Direction.up]: { x: 0, y: -6 },
    [Direction.down]: { x: 0, y: 6 },
    [Direction.left]: { x: -4, y: 0 },
    [Direction.right]: { x: 4, y: 0 },
  };

  private readonly eyeballsGraphics = generateEyeballsGraphics();

  private readonly pupilsGraphics = generatePupilsGraphics();

  constructor() {
    super();

    this.addChild(this.eyeballsGraphics);
    this.addChild(this.pupilsGraphics);
  }

  public setDirection(direction: Direction): void {
    const pupilsPosition = Eyes.pupilsPositions[direction];

    this.pupilsGraphics.position.set(pupilsPosition.x, pupilsPosition.y);
  }
}
