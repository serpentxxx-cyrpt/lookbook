import type { IPointData } from 'pixi.js';

import type { EntityState } from './game/types';
import { Direction } from './game/types';
import type { GridState, Cell } from './grid/types';
import { CellType } from './grid/types';

export function getCellIndex(state: GridState, x: number, y: number): number {
  return (y * state.width + x) >> 0;
}

export function getCell(
  state: GridState,
  x: number,
  y: number,
): Cell | undefined {
  const index = getCellIndex(state, x, y);

  return state.cells[index];
}

export function getCoordinatesByPosition(
  state: GridState,
  x: number,
  y: number,
): { x: number; y: number } {
  const cellX = (x / state.cellSize) >> 0;
  const cellY = (y / state.cellSize) >> 0;

  return {
    x: cellX,
    y: cellY,
  };
}

export function getPositionByCoordinates(
  state: GridState,
  x: number,
  y: number,
): { x: number; y: number } | undefined {
  return {
    x: x * state.cellSize,
    y: y * state.cellSize,
  };
}

export function getCellByPosition(
  state: GridState,
  x: number,
  y: number,
): Cell | undefined {
  const coordinates = getCoordinatesByPosition(state, x, y);

  return getCell(state, coordinates.x, coordinates.y);
}

export function getNextCoordinates(
  x: number,
  y: number,
  direction: Direction,
): { x: number; y: number } {
  switch (direction) {
    case Direction.up:
      return { x: x, y: y - 1 };
    case Direction.right:
      return { x: x + 1, y: y };
    case Direction.down:
      return { x: x, y: y + 1 };
    case Direction.left:
      return { x: x - 1, y: y };
    default:
      return { x, y };
  }
}

export function getNextCell(
  state: GridState,
  x: number,
  y: number,
  direction: Direction,
): Cell | undefined {
  const nextCoordinates = getNextCoordinates(x, y, direction);

  return getCell(state, nextCoordinates.x, nextCoordinates.y);
}

export function getCellDistance(
  state: GridState,
  x: number,
  y: number,
  xPosition: number,
  yPosition: number,
): number {
  const cellPosition = getPositionByCoordinates(state, x, y);

  if (!cellPosition) {
    return 0;
  }

  return Math.sqrt(
    Math.pow(xPosition - cellPosition.x, 2) +
      Math.pow(yPosition - cellPosition.y, 2),
  );
}

export function isMovingTowardsNext(
  state: GridState,
  entityState: EntityState,
  newPosition: IPointData,
): boolean {
  const { direction } = entityState;

  switch (direction) {
    case Direction.up:
      return newPosition.y % state.cellSize <= state.cellSize / 2;
    case Direction.right:
      return newPosition.x % state.cellSize >= state.cellSize / 2;
    case Direction.down:
      return newPosition.y % state.cellSize >= state.cellSize / 2;
    case Direction.left:
      return newPosition.x % state.cellSize <= state.cellSize / 2;
    default:
      return false;
  }
}

export function isWalkable(
  state: GridState,
  x: number,
  y: number,
  direction = Direction.none,
): boolean {
  const cell = getCell(state, x, y);

  if (cell === undefined) {
    return false;
  }

  if (cell.type !== CellType.wall) {
    return true;
  }

  if (direction === cell.allowedDirection) {
    return true;
  }

  return false;
}

export function canGoInDirection(
  state: GridState,
  x: number,
  y: number,
  direction: Direction,
): boolean {
  const nextCoordinates = getNextCoordinates(x, y, direction);

  return isWalkable(state, nextCoordinates.x, nextCoordinates.y, direction);
}

export function isOppositeDirection(
  direction: Direction,
  nextDirection: Direction,
): boolean {
  switch (direction) {
    case Direction.up:
      return nextDirection === Direction.down;
    case Direction.right:
      return nextDirection === Direction.left;
    case Direction.down:
      return nextDirection === Direction.up;
    case Direction.left:
      return nextDirection === Direction.right;
    default:
      return false;
  }
}
