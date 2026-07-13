import type { ReactiveEffectRunner } from '@vue/reactivity';
import { effect, stop } from '@vue/reactivity';
import type { IDestroyOptions } from 'pixi.js';
import { Container, Graphics } from 'pixi.js';

import type { EntityState } from '../../../shared/state/game/types';
import type { PacmanApplication } from '../../app/PacmanApplication';

interface Particle {
  graphics: Graphics;
  age: number;
  maxAge: number;
}

export abstract class Entity extends Container {
  protected readonly effects: ReactiveEffectRunner[] = [];

  protected readonly entityState: EntityState;

  protected readonly app: PacmanApplication;

  private lastX = 0;

  private lastY = 0;

  private trailColor = 0xffff00;

  private particles: Particle[] = [];

  private tickListener: ((deltaTime: number) => void) | undefined;

  constructor(app: PacmanApplication, entityState: EntityState) {
    super();

    this.app = app;
    this.entityState = entityState;

    this.createEffects();
  }

  public destroy(options?: IDestroyOptions | boolean | undefined): void {
    this.effects.forEach((playerEffect) => {
      stop(playerEffect);
    });

    if (this.tickListener) {
      (this.app as any).customTicker?.remove(this.tickListener);
    }

    this.particles.forEach((p) => {
      p.graphics.destroy();
    });

    super.destroy(options);
  }

  protected createEffects(): void {
    this.effects.push(
      effect(() => {
        this.setPosition(this.entityState.x, this.entityState.y);
      }),
    );
  }

  protected initTrail(color: number): void {
    this.trailColor = color;
    this.lastX = this.x;
    this.lastY = this.y;

    let pulseTime = Math.random() * 100;

    this.tickListener = (deltaTime: number) => {
      // 1. Update existing particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.age += deltaTime;

        if (p.age >= p.maxAge) {
          p.graphics.destroy();
          this.particles.splice(i, 1);
        } else {
          const lifeRatio = 1 - p.age / p.maxAge;
          p.graphics.alpha = lifeRatio * 0.35;
          const currentSize = (this.app.state.grid.cellSize * 0.3) * lifeRatio;
          p.graphics.clear();
          p.graphics.beginFill(this.trailColor);
          p.graphics.drawCircle(0, 0, Math.max(1, currentSize));
          p.graphics.endFill();
        }
      }

      // 2. Pulse/breathing animation when paused
      if (this.app.state.gameLoop.paused) {
        pulseTime += 0.05 * deltaTime;
        const scaleFactor = 1 + Math.sin(pulseTime) * 0.08;
        this.scale.set(scaleFactor);
        return;
      } else {
        this.scale.set(1.0);
      }

      // 3. Spawn a new particle if we moved
      const dx = this.x - this.lastX;
      const dy = this.y - this.lastY;
      const movedDist = Math.sqrt(dx * dx + dy * dy);

      if (movedDist > 0.5) {
        this.spawnParticle(this.x, this.y);
        this.lastX = this.x;
        this.lastY = this.y;
      }
    };

    (this.app as any).customTicker?.add(this.tickListener);
  }

  private spawnParticle(x: number, y: number): void {
    if (!this.parent) {
      return;
    }

    const g = new Graphics();
    g.beginFill(this.trailColor);
    g.drawCircle(0, 0, this.app.state.grid.cellSize * 0.3);
    g.endFill();
    g.position.set(x, y);
    g.alpha = 0.35;

    // Place it under the characters (at index 0 in the game container)
    this.parent.addChildAt(g, 0);

    this.particles.push({
      graphics: g,
      age: 0,
      maxAge: 25,
    });
  }

  private setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }
}
