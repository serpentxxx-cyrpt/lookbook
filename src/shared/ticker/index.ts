import { Ticker } from 'pixi.js';

export function createTicker(autoStart = true): Ticker {
  const ticker = new Ticker();

  if (autoStart) {
    ticker.start();
  }

  return ticker;
}
