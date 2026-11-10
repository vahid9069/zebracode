// src/lib/env.ts
const envUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Prevent localhost URLs from ever leaking into production builds
export const BASE_URL = (process.env.NODE_ENV === 'production' && (!envUrl || envUrl.includes('localhost')))
    ? 'https://zebracode.ir'
    : (envUrl || 'https://zebracode.ir');
