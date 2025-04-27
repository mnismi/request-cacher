import { defineConfig } from 'tsup';

export default [
    defineConfig({
        entry: ['src/hono/index.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist/hono',
        dts: true,
        clean: true,
        external: ['hono'],
    }),
    defineConfig({
        entry: ['src/express/index.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist/express',
        dts: true,
        clean: true,
        external: ['express'],
    }),
];
