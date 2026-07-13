import { defineConfig } from 'astro/config';
import path from 'node:path';

export default defineConfig({
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
