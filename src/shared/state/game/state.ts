import { reactive } from '@vue/reactivity';

import { config } from '../../../config';

import type { GameState } from './types';
import { Direction } from './types';

export function createGameState(): GameState {
  return reactive<GameState>({
    score: 0,
    player: {
      id: 'player',
      x: 0,
      y: 0,
      speed: config.playerSpeed,
      isMoving: false,
      direction: Direction.none,
      nextDirection: Direction.none,
      collision: null,
    },
    npc: [],
  });
}
