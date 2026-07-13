import { reactive } from '@vue/reactivity';

import { Direction, NpcState } from './types';
import type { GameState, EntityState, NpcEntityState } from './types';

export function setEntityDirection(
  entity: EntityState,
  nextDirection: Direction,
): void {
  entity.nextDirection = nextDirection;
}

export function setEntityPosition(
  entity: EntityState,
  x: number,
  y: number,
): void {
  entity.x = x;
  entity.y = y;
}

export function setNpcState(
  npcEnityState: NpcEntityState,
  state: NpcState,
): void {
  npcEnityState.state = state;
}

export function registerNpc(
  state: GameState,
  id: NpcEntityState['id'],
  color: NpcEntityState['color'],
  route: NpcEntityState['route'],
): NpcEntityState {
  const newNpc = reactive<NpcEntityState>({
    id,
    color,
    route,
    x: Math.random() * 500,
    y: Math.random() * 500,
    speed: 2,
    state: NpcState.roaming,
    isMoving: false,
    direction: Direction.none,
    nextDirection: Direction.none,
  });

  state.npc.push(newNpc);

  return newNpc;
}
