import type { IPointData } from 'pixi.js';

import { config } from '../../config';
import { random } from '../utils/random';

import { setEntityDirection, setEntityPosition } from './game/actions';
import type { EntityState, GameState, NpcEntityState } from './game/types';
import { NpcState, Direction } from './game/types';
import { restoreTakenDots } from './grid/actions';
import type { Cell, GridState } from './grid/types';
import { DotType, CellType } from './grid/types';
import {
  canGoInDirection,
  getCell,
  getCellByPosition,
  getCoordinatesByPosition,
  getNextCoordinates,
  isMovingTowardsNext,
  isOppositeDirection,
  isWalkable,
} from './helpers';
import type { ApplicationState } from './types';

const directionMovement: Record<Direction, IPointData> = {
  none: { x: 0, y: 0 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
};

function isWithinSnapRange(gridState: GridState, value: number): boolean {
  const { cellSize, turningThreshold } = gridState;

  const centerOffset = Math.abs((value % cellSize) - cellSize / 2);

  return centerOffset < turningThreshold;
}

function snapToGridCenter(gridState: GridState, value: number): number {
  const { cellSize } = gridState;

  return ((value / cellSize) >> 0) * cellSize + cellSize / 2;
}

function handleWallHit(
  gridState: GridState,
  entityState: EntityState,
  newPosition: IPointData,
): IPointData {
  const gridPosition = getCoordinatesByPosition(
    gridState,
    newPosition.x,
    newPosition.y,
  );

  const nextCoordinates = getNextCoordinates(
    gridPosition.x,
    gridPosition.y,
    entityState.direction,
  );

  const walkable = isWalkable(
    gridState,
    nextCoordinates.x,
    nextCoordinates.y,
    entityState.direction,
  );

  if (walkable) {
    return newPosition;
  }

  const movingTowardsNext = isMovingTowardsNext(
    gridState,
    entityState,
    newPosition,
  );

  if (!movingTowardsNext) {
    return newPosition;
  }

  return {
    x: snapToGridCenter(gridState, newPosition.x),
    y: snapToGridCenter(gridState, newPosition.y),
  };
}

function commitEntityDirection(entityState: EntityState): void {
  entityState.direction = entityState.nextDirection;
  entityState.nextDirection = Direction.none;
}

function tickNextDirection(
  state: ApplicationState,
  entityState: EntityState,
  nextPosition: IPointData,
): void {
  if (entityState.nextDirection === Direction.none) {
    return;
  }

  if (entityState.direction === Direction.none) {
    commitEntityDirection(entityState);
    return;
  }

  const entityCoordinates = getCoordinatesByPosition(
    state.grid,
    entityState.x,
    entityState.y,
  );

  if (
    !canGoInDirection(
      state.grid,
      entityCoordinates.x,
      entityCoordinates.y,
      entityState.nextDirection,
    )
  ) {
    return;
  }

  // 180° turn does not need to wait for the next grid snap
  if (isOppositeDirection(entityState.direction, entityState.nextDirection)) {
    commitEntityDirection(entityState);
    return;
  }

  if (
    (entityState.direction === Direction.up ||
      entityState.direction === Direction.down) &&
    isWithinSnapRange(state.grid, nextPosition.y)
  ) {
    commitEntityDirection(entityState);
    return;
  }

  if (
    (entityState.direction === Direction.left ||
      entityState.direction === Direction.right) &&
    isWithinSnapRange(state.grid, nextPosition.x)
  ) {
    commitEntityDirection(entityState);
    return;
  }

  // TODO: Solve fast-bullet problem
}

function getNextPosition(
  state: ApplicationState,
  entityState: EntityState,
  deltaTime: number,
): IPointData {
  const movement = directionMovement[entityState.direction];
  const delta = deltaTime || 1;

  return {
    x:
      entityState.x +
      movement.x *
        entityState.speed *
        (state.grid.cellSize / config.deltaTimeDivisor) *
        delta,
    y:
      entityState.y +
      movement.y *
        entityState.speed *
        (state.grid.cellSize / config.deltaTimeDivisor) *
        delta,
  };
}

export function tickEntityMovement(
  state: ApplicationState,
  entityState: EntityState,
  deltaTime: number,
): void {
  const originalDirection = entityState.direction;

  let newPosition = getNextPosition(state, entityState, deltaTime);

  tickNextDirection(state, entityState, newPosition);

  if (originalDirection !== entityState.direction) {
    newPosition = getNextPosition(state, entityState, deltaTime);
  }

  if (
    entityState.direction === Direction.up ||
    entityState.direction === Direction.down
  ) {
    newPosition.x = snapToGridCenter(state.grid, newPosition.x);
    newPosition.y = handleWallHit(state.grid, entityState, newPosition).y;
  } else if (
    entityState.direction === Direction.right ||
    entityState.direction === Direction.left
  ) {
    newPosition.y = snapToGridCenter(state.grid, newPosition.y);
    newPosition.x = handleWallHit(state.grid, entityState, newPosition).x;
  }

  entityState.isMoving =
    entityState.x !== newPosition.x || entityState.y !== newPosition.y;
  entityState.x = newPosition.x;
  entityState.y = newPosition.y;
}

function tickNpcState(state: ApplicationState, npc: NpcEntityState): void {
  if (npc.state === NpcState.roaming) {
    return;
  }

  const npcCoordinates = getCoordinatesByPosition(state.grid, npc.x, npc.y);

  for (const respawnEndLocation of config.respawnEndLocations) {
    if (
      npcCoordinates.x === respawnEndLocation.x &&
      npcCoordinates.y === respawnEndLocation.y
    ) {
      npc.state = NpcState.roaming;
      return;
    }
  }
}

function tickNpcEntities(state: ApplicationState, deltaTime: number): void {
  const npcs = state.game.npc;

  for (const npc of npcs) {
    tickNpcState(state, npc);

    const npcCoordinates = getCoordinatesByPosition(state.grid, npc.x, npc.y);

    if (npc.state === NpcState.respawning) {
      setEntityDirection(npc, Direction.up);
    } else {
      // 1. Deflect immediately if blocked by wall or screen edge
      if (!canGoInDirection(state.grid, npcCoordinates.x, npcCoordinates.y, npc.direction)) {
        const possibleDirections = [Direction.up, Direction.right, Direction.down, Direction.left].filter(
          (dir) => canGoInDirection(state.grid, npcCoordinates.x, npcCoordinates.y, dir)
        );

        if (possibleDirections.length > 0) {
          const forwardDirections = possibleDirections.filter(
            (dir) => !isOppositeDirection(npc.direction, dir)
          );

          const chosenDir = forwardDirections.length > 0
            ? forwardDirections[Math.floor(Math.random() * forwardDirections.length)]
            : possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

          setEntityDirection(npc, chosenDir);
        }
      } else {
        // 2. Otherwise, check for random direction changes at junctions
        if (
          npc.direction !== Direction.left &&
          canGoInDirection(
            state.grid,
            npcCoordinates.x,
            npcCoordinates.y,
            Direction.right,
          ) &&
          random.bool({ likelihood: config.ghostDirectionChangeLikelihood })
        ) {
          setEntityDirection(npc, Direction.right);
        } else if (
          npc.direction !== Direction.right &&
          canGoInDirection(
            state.grid,
            npcCoordinates.x,
            npcCoordinates.y,
            Direction.left,
          ) &&
          random.bool({ likelihood: config.ghostDirectionChangeLikelihood })
        ) {
          setEntityDirection(npc, Direction.left);
        } else if (
          npc.direction !== Direction.down &&
          canGoInDirection(
            state.grid,
            npcCoordinates.x,
            npcCoordinates.y,
            Direction.up,
          ) &&
          random.bool({ likelihood: config.ghostDirectionChangeLikelihood })
        ) {
          setEntityDirection(npc, Direction.up);
        } else if (
          npc.direction !== Direction.up &&
          canGoInDirection(
            state.grid,
            npcCoordinates.x,
            npcCoordinates.y,
            Direction.down,
          ) &&
          random.bool({ likelihood: config.ghostDirectionChangeLikelihood })
        ) {
          setEntityDirection(npc, Direction.down);
        }
      }
    }

    tickEntityMovement(state, npc, deltaTime);
  }
}

function tickPlayerCollisions(state: GameState): void {
  const player = state.player;

  if (!player.isMoving) {
    return;
  }

  for (const npc of state.npc) {
    const distance = Math.sqrt(
      Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2),
    );

    if (distance < config.collisionDistance) {
      player.collision = npc;
      break;
    }
  }
}

function tickPlayerPicks(state: ApplicationState): void {
  const player = state.game.player;

  if (!player.isMoving) {
    return;
  }

  const currentCell = getCellByPosition(state.grid, player.x, player.y);

  if (!currentCell) {
    return;
  }

  if (currentCell.type !== CellType.empty || currentCell.taken) {
    return;
  }

  if (currentCell.dot !== DotType.dot && currentCell.dot !== DotType.power) {
    return;
  }

  const coordinates = getCoordinatesByPosition(state.grid, player.x, player.y);
  const dotPosition = {
    x: (0.5 + coordinates.x) * state.grid.cellSize,
    y: (0.5 + coordinates.y) * state.grid.cellSize,
  };

  const distance = Math.sqrt(
    Math.pow(player.x - dotPosition.x, 2) +
      Math.pow(player.y - dotPosition.y, 2),
  );

  if (distance > config.pickDistance) {
    return;
  }

  state.grid.dotsRemaining--;
  currentCell.taken = true;

  if (state.grid.dotsRemaining === 0) {
    restoreTakenDots(state.grid);
  }
}

export function tickApplication(
  state: ApplicationState,
  deltaTime: number,
): void {
  tickEntityMovement(state, state.game.player, deltaTime);
  tickNpcEntities(state, deltaTime);
  tickPlayerPicks(state);
  tickPlayerCollisions(state.game);
}

export function randomizeEntityPosition(
  state: ApplicationState,
  entity: EntityState,
): void {
  let randomX = 0;
  let randomY = 0;
  let targetCell: Cell | undefined = undefined;

  do {
    randomX = random.integer({ min: 1, max: state.grid.width - 2 });
    randomY = random.integer({ min: 1, max: state.grid.height - 2 });

    targetCell = getCell(state.grid, randomX, randomY);
  } while (!targetCell || targetCell.type !== CellType.empty);

  setEntityPosition(
    entity,
    (0.5 + randomX) * state.grid.cellSize,
    (0.5 + randomY) * state.grid.cellSize,
  );
}
export function setPlayerDirection(
  state: GameState,
  nextDirection: Direction,
): void {
  setEntityDirection(state.player, nextDirection);
}
