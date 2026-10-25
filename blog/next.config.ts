import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
    output: 'export',
    basePath: '/blog',
    trailingSlash: true,
    images: { unoptimized: true },
    // This is its own app; never share the parent app's .next folder or lockfile root.
    outputFileTracingRoot: path.resolve(__dirname),
};

export default config;
