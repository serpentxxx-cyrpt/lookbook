import { defineConfig } from 'astro/config';
import path from 'node:path';

export default defineConfig({
  site: 'https://serpentxxx-cyrpt.github.io',
  base: '/lookbook',
  srcDir: 'src',
  outDir: 'dist',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  vite: {
    resolve: {
      alias: {
        '~': path.resolve(process.cwd(), 'src'),
      },
    },
  },
});
