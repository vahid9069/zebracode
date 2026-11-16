import type { NextConfig } from 'next';
import path from 'node:path';

const isProd = process.env.NODE_ENV === 'production';

const config: NextConfig = {
    ...(isProd ? { output: 'export' } : {}),
    basePath: '/blog',
    trailingSlash: true,
    images: { unoptimized: true },
    // This is its own app; never share the parent app's .next folder or lockfile root.
    outputFileTracingRoot: path.resolve(__dirname),
};

export default config;
