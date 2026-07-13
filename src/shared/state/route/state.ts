import { reactive } from '@vue/reactivity';

import type { RouteState } from './types';

export function createRouteState(): RouteState {
  return reactive<RouteState>({
    currentRoute: '',
  });
}
