import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed exclude for lucide-react to fix module loading in Firefox
  optimizeDeps: {
    // exclude: ['lucide-react'],
  },
});
