// vitest.config.ts
import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: { exclude: [...configDefaults.exclude, 'blog/**'] },
    // Next preserves JSX for its own compiler; Vitest must compile component smoke tests.
    oxc: { jsx: { runtime: 'automatic' } },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
