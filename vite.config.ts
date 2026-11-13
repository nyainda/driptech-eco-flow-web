import fs from "node:fs";
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const appBuildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const versionManifestPlugin: PluginOption = {
    name: 'driptech-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(JSON.stringify({ buildId: appBuildId, builtAt: new Date().toISOString() }));
      });
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir || path.resolve(__dirname, 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify({ buildId: appBuildId, builtAt: new Date().toISOString() }, null, 2),
        'utf-8',
      );
    },
  };

  const plugins: PluginOption[] = [
    react(),
    versionManifestPlugin,
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
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
        // Never precache HTML or version.json so deploys take effect automatically
        // without forcing visitors to clear cookies or site data.
        globPatterns: ['assets/**/*.{js,css,ico,png,webp,woff2}', 'manifest.webmanifest'],
        globIgnores: ['**/favicon.svg', '**/version.json'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'driptech-html-nav',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 300,
              },
            },
          },
        ],
      }
    }),
  ];

  // componentTagger removed (ESM doesn't support require())

  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
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