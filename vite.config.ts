import { VitePWA } from 'vite-plugin-pwa';
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'DripTech EcoFlow',
        short_name: 'DripTech',
        description: 'Smart irrigation solutions for sustainable agriculture',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,xml}'],
        cleanupOutdatedCaches: true
      }
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
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Minify options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
      rollupOptions: {
        output: {
          // Aggressive code splitting for better caching and smaller initial load
          manualChunks: (id) => {
            // CRITICAL: Keep React, ReactDOM, React Query, and all React hooks together
            // This prevents the "Cannot read properties of undefined (reading 'createContext')" error
            if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-is/') ||
              id.includes('/react/') && id.includes('node_modules') ||
              id.includes('/react-dom/') && id.includes('node_modules') ||
              id.includes('@tanstack/react-query') ||
              id.includes('react-helmet-async') ||
              id.includes('next-themes')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Radix UI components - Keep react-use-layout-effect with react-core
            if (id.includes('@radix-ui/react-use-layout-effect')) {
              return 'react-core'; // IMPORTANT: Keep with React
            }
            // Other Radix UI components - split by component for better caching
            if (id.includes('@radix-ui')) {
              const component = id.split('@radix-ui/')[1]?.split('/')[0];
              return `radix-${component}`;
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms';
            }
            // PDF libraries - VERY HEAVY
            if (id.includes('jspdf') || id.includes('html2pdf') || id.includes('html2canvas')) {
              return 'pdf';
            }
            // Chart libraries - HEAVY
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs')) {
              return 'charts';
            }
            // Rich text editors - HEAVY
            if (id.includes('react-quill') || id.includes('tinymce') || id.includes('quill')) {
              return 'editors';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'utils';
            }
            // Other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // Optimize chunk file names for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.');
            const ext = info?.[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `assets/images/[name]-[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
      ],
      exclude: ['@tanstack/react-query-devtools'],
    },
  };
});