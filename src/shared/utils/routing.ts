export function getRelativePath(path: string): string {
  const base = import.meta.env.BASE_URL; // e.g., "/lookbook/" or "/"
  if (base === '/') {
    return path;
  }

  const cleanBase = base.replace(/\/$/, ''); // e.g., "/lookbook"

  if (path === cleanBase) {
    return '/';
  }
  if (path.startsWith(cleanBase + '/')) {
    return path.slice(cleanBase.length);
  }
  return path;
}

export function getAbsoluteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g., "/lookbook" or ""
  if (path === '/') {
    return base || '/';
  }
  return `${base}${path}`;
}
