import type { Direction } from '../game/types';

export enum CellType {
  empty = 'empty',
  wall = 'wall',
  blocked = 'blocked',
}

export enum WallType {
  horizontal = 'horizontal',
  vertical = 'vertical',
  cornerTopLeft = 'cornerTopLeft',
  cornerTopRight = 'cornerTopRight',
  cornerBottomRight = 'cornerBottomRight',
  cornerBottomLeft = 'cornerBottomLeft',
}

export enum DotType {
  empty = 'empty',
  never = 'never',
  dot = 'dot',
  power = 'power',
}

export interface EmptyCell {
  type: CellType.empty;
  dot: DotType;
  taken: boolean;
}

export interface WallCell {
  type: CellType.wall;
  wallType: WallType;
  thickness?: number;
  color?: number;
  allowedDirection?: Direction;
}

export interface BlockedCell {
  type: CellType.blocked;
}

export type Cell = BlockedCell | EmptyCell | WallCell;

export interface GridState {
  width: number;
  height: number;
  cellSize: number;
  cells: Cell[];
  turningThreshold: number;
  dotsRemaining: number;
}
