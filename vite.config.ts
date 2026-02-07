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
          // Simplified code splitting to prevent React context errors
          manualChunks: (id) => {
            // Keep ALL React-related packages together in one chunk
            if (id.includes('node_modules')) {
              // React ecosystem - MUST stay together
              if (id.includes('react') ||
                id.includes('@tanstack/react-query') ||
                id.includes('react-router') ||
                id.includes('react-helmet') ||
                id.includes('next-themes') ||
                id.includes('@radix-ui')) {
                return 'react-vendor';
              }

              // Heavy libraries in separate chunks
              if (id.includes('jspdf') || id.includes('html2pdf') || id.includes('html2canvas')) {
                return 'pdf';
              }
              if (id.includes('chart.js') || id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('react-quill') || id.includes('tinymce') || id.includes('quill')) {
                return 'editors';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }

              // Everything else
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