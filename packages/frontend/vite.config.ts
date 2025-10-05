import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

// Create require function for ES modules
const require = createRequire(import.meta.url);

// Helper function to copy the pdf.js worker
const copyPdfWorker = () => {
  return {
    name: "copy-pdf-worker",
    enforce: "post" as const,
    async writeBundle(options: { dir: string }) {
      try {
        // Try multiple possible paths for the worker
        let workerSrc;
        try {
          workerSrc = resolve(
            require.resolve("pdfjs-dist/build/pdf.worker.js"),
            "../pdf.worker.min.js"
          );
        } catch (e) {
          try {
            workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.min.js");
          } catch (e2) {
            workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.js");
          }
        }
        
        const workerDest = resolve(options.dir, "pdf.worker.min.js");
        await mkdir(resolve(workerDest, ".."), { recursive: true });
        await copyFile(workerSrc, workerDest);
      } catch (error) {
        console.warn("Failed to copy PDF worker:", error);
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React 19 optimizations
      babel: {
        plugins: [
          // Enable automatic JSX runtime optimizations
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }), 
    copyPdfWorker()
  ],
  
  // Advanced build optimizations for 10x performance
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000,
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    
    rollupOptions: {
      output: {
        // Advanced code splitting for faster loading
        manualChunks: {
          // Core React chunks
          'react-vendor': ['react', 'react-dom'],
          
          // UI library chunks
          'ui-vendor': ['framer-motion', '@headlessui/react', 'lucide-react'],
          
          // Utility chunks
          'utils-vendor': ['zustand', 'date-fns', 'mathjs'],
          
          // PDF and crypto chunks (heavy libraries)
          'heavy-vendor': ['pdfjs-dist', 'crypto-js'],
          
          // App chunks - split by functionality
          'file-manager': ['./src/apps/file-manager/FileManagerApp'],
          'text-editor': ['./src/apps/xnote/XnoteApp', './src/apps/xedit/XEditApp'],
          'dev-tools': ['./src/apps/xshell/XShell', './src/apps/developer-settings/DeveloperSettingsApp'],
        },
        
        // Optimize chunk loading
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  
  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
    allowedHosts: [".trycloudflare.com", ".localhost"],
  },
  
  resolve: {
    alias: {
      "color-thief-react": resolve(
        __dirname,
        "../../node_modules/color-thief-react",
      ),
    },
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'framer-motion',
      '@headlessui/react',
      'lucide-react',
    ],
    exclude: ['pdfjs-dist'], // Heavy library - load on demand
  },
  
  // Enable experimental features for better performance
  esbuild: {
    target: 'esnext',
    treeShaking: true,
    legalComments: 'none',
  },
});