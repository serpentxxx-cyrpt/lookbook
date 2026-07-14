import { effect } from '@vue/reactivity';
import type { Sprite } from 'pixi.js';

import type {
  Direction,
  NpcEntityState,
} from '../../../shared/state/game/types';
import { NpcEntityColor } from '../../../shared/state/game/types';
import type { PacmanApplication } from '../../app/PacmanApplication';
import { AssetsLoader, SpriteSheets } from '../../loaders/AssetsLoader';

import { Entity } from './Entity';
import { Eyes } from './Eyes';

export class Ghost extends Entity {
  private static readonly tintMap: Record<NpcEntityColor, number> = {
    [NpcEntityColor.red]: 0xff0000,
    [NpcEntityColor.blue]: 0x00ffde,
    [NpcEntityColor.pink]: 0xffb8de,
    [NpcEntityColor.orange]: 0xffb847,
  };

  protected readonly entityState: NpcEntityState;

  private eyes: Eyes | undefined;

  private sprite: Sprite | undefined;

  constructor(app: PacmanApplication, entityState: NpcEntityState) {
    super(app, entityState);

    this.entityState = entityState;

    this.interactive = true;
    this.buttonMode = true;

    this.on('pointertap', () => {
      if (this.x !== 0 && this.y !== 0) {
        app.router.navigate(this.entityState.route);
      }
    });

    this.createObject();
    
    const ghostColor = Ghost.tintMap[this.entityState.color] || 0xff00ff;
    this.initTrail(ghostColor);
  }

  protected createObject(): void {
    const sprite = AssetsLoader.getAnimatedSprite(
      SpriteSheets.ghostSpriteSheet,
    );

    if (!sprite) {
      return;
    }

    sprite.anchor.set(0.5);
    sprite.animationSpeed = 0.1;
    sprite.play();

    sprite.tint = Ghost.tintMap[this.entityState.color];

    const eyes = new Eyes();

    this.sprite = sprite;
    this.eyes = eyes;

    this.setScale();

    this.addChild(sprite);
    this.addChild(eyes);
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

  protected setScale(): void {
    const tileSize = this.app.state.grid.cellSize;

    this.sprite?.scale.set(tileSize / 60);
    this.eyes?.scale.set(tileSize / 60);
  }

  protected setDirection(direction: Direction): void {
    if (!this.eyes) {
      return;
    }

    this.eyes.setDirection(direction);
  }
}
