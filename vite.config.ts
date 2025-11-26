import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80, lossless: true },
    }),
  ];

  // Only load componentTagger in development mode
  if (mode === 'development') {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger.componentTagger());
    } catch (error) {
      console.warn('lovable-tagger not available:', error);
    }
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 5000,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-toast', 'lucide-react'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});