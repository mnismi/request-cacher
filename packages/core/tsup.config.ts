import { defineConfig } from 'tsup'

// export default [
//   defineConfig({
//     entry: ['src/index.ts'],
//     format: ['esm', 'cjs'],
//     outDir: 'dist',
//     dts: true,
//     clean: true,
//     external: ['hono', 'express', 'ioredis'],
//   }),
//   defineConfig({
//     entry: ['src/hono/index.ts'],
//     format: ['esm', 'cjs'],
//     outDir: 'dist/hono',
//     dts: true,
//     clean: true,
//     external: ['hono', 'ioredis'],
//   }),
//   defineConfig({
//     entry: ['src/express/index.ts'],
//     format: ['esm', 'cjs'],
//     outDir: 'dist/express',
//     dts: true,
//     clean: true,
//     external: ['express', 'ioredis'],
//   }),
// ]

export default [
  defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: true,
    clean: true,
    external: ['hono', 'express', 'ioredis'],
  }),
  defineConfig({
    entry: ['src/hono/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'dist/hono',
    dts: true,
    clean: true,
    external: ['hono', 'ioredis'],
  }),
  defineConfig({
    entry: ['src/express/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'dist/express',
    dts: true,
    clean: true,
    external: ['express', 'ioredis'],
  }),
]
