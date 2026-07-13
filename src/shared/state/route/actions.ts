import type { RouteState } from './types';

export function setCurrentRoute(state: RouteState, route: string): void {
  state.currentRoute = route;
}
