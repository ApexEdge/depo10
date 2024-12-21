import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    imageService: 'cloudflare'
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/cloudflare'
    }
  },
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      minify: 'esbuild', // Changed from 'terser' to 'esbuild'
      cssMinify: true
    },
    ssr: {
      noExternal: ['@astrojs/cloudflare']
    }
  },
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin"
    }
  }
});
