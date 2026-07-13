import { effect } from '@vue/reactivity';
import type { Sprite } from 'pixi.js';

import type { EntityState } from '../../../shared/state/game/types';
import { Direction } from '../../../shared/state/game/types';
import type { PacmanApplication } from '../../app/PacmanApplication';
import { AssetsLoader, SpriteSheets } from '../../loaders/AssetsLoader';

import { Entity } from './Entity';

export class Pacman extends Entity {
  private sprite: Sprite | undefined;

  constructor(app: PacmanApplication, entityState: EntityState) {
    super(app, entityState);

    this.createObject();
    this.initTrail(0xffff00);
  }

  protected createEffects(): void {
    super.createEffects();

    this.effects.push(
      effect(() => {
        this.setDirection(this.entityState.direction);
      }),
    );

    this.effects.push(
      effect(() => {
        this.setScale();
      }),
    );
  }

  protected createObject(): void {
    const sprite = AssetsLoader.getAnimatedSprite(
      SpriteSheets.pacmanSpriteSheet,
    );

    if (!sprite) {
      return;
    }

    sprite.width = this.app.state.grid.cellSize;
    sprite.height = this.app.state.grid.cellSize;

    sprite.anchor.set(0.5);
    sprite.animationSpeed = 0.2;
    sprite.play();

    this.sprite = sprite;

    this.addChild(sprite);
  }

  protected setScale(): void {
    const tileSize = this.app.state.grid.cellSize;

    this.sprite?.scale.set(tileSize / 60);
  }

  protected setDirection(direction: Direction): void {
    switch (direction) {
      case Direction.up:
        this.rotation = -Math.PI / 2;
        break;
      case Direction.down:
        this.rotation = Math.PI / 2;
        break;
      case Direction.left:
        this.rotation = Math.PI;
        break;
      default:
        this.rotation = 0;
        break;
    }
  }
}
