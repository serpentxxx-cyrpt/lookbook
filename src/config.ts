import type { GameConfig } from './types';

export const config: GameConfig = {
  playerSpeed: 5,
  wallColor: 0x2121de,
  wallThickness: 3,
  dotColor: 0xffb897,
  pageTransitionDuration: 500,
  collisionDistance: 20,
  pickDistance: 10,
  respawnLocation: {
    x: 28,
    y: 14.5,
  },
  respawnEndLocations: [
    { x: 27, y: 12 },
    { x: 28, y: 12 },
  ],
  ghostDirectionChangeLikelihood: 5,
  deltaTimeDivisor: 60,
};
