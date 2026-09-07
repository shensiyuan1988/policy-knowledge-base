import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/policy-knowledge-base/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
