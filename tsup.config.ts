import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig([
  // Library build (for npm package consumers)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    injectStyle: false,
    onSuccess: async () => {
      // Copy CSS file to dist
      mkdirSync('dist/styles', { recursive: true });
      copyFileSync('src/styles/styles.css', 'dist/styles.css');
    },
  },
  // Embeddable widget build (for CDN/script tag usage)
  {
    entry: ['src/embed/index.ts'],
    outDir: 'dist/embed',
    format: ['iife'],
    globalName: 'ChatWidget',
    minify: true,
    splitting: false,
    sourcemap: false,
    clean: false, // Don't clean, we need the library build files
    // Bundle React and ReactDOM into the widget
    noExternal: ['react', 'react-dom', 'react-markdown'],
    esbuildOptions(options) {
      // Define constants for browser build
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        '__POSTHOG_API_KEY__': `"${process.env.POSTHOG_API_KEY || ''}"`,
      };
    },
    onSuccess: async () => {
      // Copy and rename the embed bundle for versioned CDN
      const fs = await import('fs');
      const path = await import('path');

      // Create v1 directory structure
      mkdirSync('dist/embed/v1', { recursive: true });

      // Copy main bundle
      if (fs.existsSync('dist/embed/index.global.js')) {
        copyFileSync('dist/embed/index.global.js', 'dist/embed/v1/chat-widget.min.js');
      }

      // Copy styles for embed
      copyFileSync('src/styles/styles.css', 'dist/embed/v1/styles.css');

      // Create embed-specific styles with Shadow DOM reset
      const embedStyles = fs.readFileSync('src/styles/styles.css', 'utf-8');
      const shadowDomStyles = `
/* Shadow DOM Reset */
:host {
  all: initial;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:host * {
  box-sizing: border-box;
}

${embedStyles}
`;
      fs.writeFileSync('dist/embed/v1/styles.css', shadowDomStyles);

      console.log('✓ Embed bundle created at dist/embed/v1/chat-widget.min.js');
    },
  },
]);
