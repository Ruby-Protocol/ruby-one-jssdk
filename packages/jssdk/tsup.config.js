const { defineConfig } = require('tsup')

const config = defineConfig([
  {
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: false,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    outDir: './dist'
  },
  {
    entry: ['src/style.css'],
    outDir: './dist'
  }
])

module.exports = config
