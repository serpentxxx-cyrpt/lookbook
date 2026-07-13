export type AppRouter = {
  root: string;
  navigate: (path: string) => void;
  setNavigate: (impl: (path: string) => void) => void;
  on: (..._args: unknown[]) => void;
  hooks: (..._args: unknown[]) => void;
  resolve: () => void;
};

/**
 * Lightweight router facade that defers to full page navigation. This avoids
 * preloading every subpage and lets Astro serve only the current route.
 */
export function createRouter(): AppRouter {
  let navigateImpl = (path: string): void => {
    window.location.assign(path);
  };

  return {
    root: '/',
    navigate: (path: string) => navigateImpl(path),
    setNavigate: (impl: (path: string) => void) => {
      navigateImpl = impl;
    },
    on: () => {},
    hooks: () => {},
    resolve: () => {},
  };
}
