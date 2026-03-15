#!/usr/bin/env node
/**
 * Pilot Light Build Script
 *
 * Extracts inline JSX from index.html, pre-compiles it with Babel,
 * swaps CDN links to production builds, and outputs index-built.html.
 *
 * Usage: node build.js
 * Output: index-built.html (optimized, ready for deploy)
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const INPUT = path.join(__dirname, 'index.html');
const OUTPUT = path.join(__dirname, 'index-built.html');

console.log('Building optimized Pilot Light...');
console.time('Build completed in');

// Read the source file
const html = fs.readFileSync(INPUT, 'utf8');

// Extract the Babel script content
const babelScriptRegex = /<script type="text\/babel">([\s\S]*?)<\/script>/;
const match = html.match(babelScriptRegex);

if (!match) {
  console.error('ERROR: Could not find <script type="text/babel"> block');
  process.exit(1);
}

const jsxSource = match[1];
console.log(`  Extracted ${jsxSource.length.toLocaleString()} characters of JSX`);

// Compile JSX to plain JavaScript
let compiled;
try {
  const result = babel.transformSync(jsxSource, {
    presets: ['@babel/preset-react'],
    filename: 'app.jsx',
    sourceMaps: false,
    compact: false, // Keep readable for debugging
  });
  compiled = result.code;
  console.log(`  Compiled to ${compiled.length.toLocaleString()} characters of JavaScript`);
} catch (err) {
  console.error('ERROR: Babel compilation failed:');
  console.error(err.message);
  process.exit(1);
}

// Build the optimized HTML
let optimized = html;

// 1. Replace development React with production builds (pinned versions)
optimized = optimized.replace(
  '<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>',
  '<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>'
);
optimized = optimized.replace(
  '<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>',
  '<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>'
);

// 2. Remove Babel standalone (no longer needed)
optimized = optimized.replace(
  '  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n',
  ''
);

// 3. Replace the <script type="text/babel">...</script> with compiled <script>...</script>
optimized = optimized.replace(
  babelScriptRegex,
  `<script>${compiled}</script>`
);

// Write the optimized file
fs.writeFileSync(OUTPUT, optimized, 'utf8');

const originalSize = Buffer.byteLength(html, 'utf8');
const optimizedSize = Buffer.byteLength(optimized, 'utf8');
const savedKB = ((originalSize - optimizedSize) / 1024).toFixed(1);

console.log(`  Original:  ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`  Optimized: ${(optimizedSize / 1024).toFixed(1)} KB (${savedKB} KB smaller)`);
console.log(`  Saved to:  ${OUTPUT}`);
console.log('');
console.log('  CDN savings (no longer downloaded by browser):');
console.log('    - @babel/standalone: ~800 KB (REMOVED)');
console.log('    - react.development → react.production.min: ~60 KB savings');
console.log('    - react-dom.development → react-dom.production.min: ~100 KB savings');
console.log('    - No more in-browser JSX compilation (biggest speed gain)');
console.timeEnd('Build completed in');
console.log('');
console.log('To test: open index-built.html in your browser or deploy to Netlify');
console.log('To deploy: rename index-built.html to index.html and push to GitHub');
