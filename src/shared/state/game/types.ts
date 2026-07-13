export enum Direction {
  none = 'none',
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right',
}

export enum NpcEntityColor {
  red = 'red',
  blue = 'blue',
  pink = 'pink',
  orange = 'orange',
}

export enum NpcState {
  respawning = 'respawning',
  roaming = 'roaming',
}

export interface EntityState {
  id: string;
  x: number;
  y: number;
  isMoving: boolean;
  speed: number;
  direction: Direction;
  nextDirection: Direction;
}

export interface PlayerEntityState extends EntityState {
  collision: NpcEntityState | null;
}

export interface NpcEntityState extends EntityState {
  state: NpcState;
  color: NpcEntityColor;
  route: string;
}

export interface GameState {
  score: number;
  player: PlayerEntityState;
  npc: NpcEntityState[];
}
