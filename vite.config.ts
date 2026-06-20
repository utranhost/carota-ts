import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3003,
    open: true
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/carota.ts',
      name: 'carota',
      fileName: 'carota',
      formats: ['umd', 'es']
    }
  }
});
