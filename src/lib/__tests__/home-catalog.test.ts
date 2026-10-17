import { describe, expect, it } from 'vitest';
import { AllToolsList } from '@/lib/registry/tools';
import {
    createHomeFilters,
    filterHomeTools,
    getAvailableHomeModes,
    getHomeToolHref,
} from '@/lib/home-catalog';
import type { ToolMeta } from '@/types/types';

const tool = (overrides: Partial<ToolMeta>): ToolMeta => ({
    type: 'fixture',
    category: 'converters',
    subCategory: 'json',
    title: 'Fixture',
    shortDescription: 'Fixture tool',
    description: 'Fixture tool',
    icon: (() => null) as ToolMeta['icon'],
    href: '/fixture',
    inputLanguage: 'text',
    outputLanguage: 'text',
    transformFunction: () => '',
    ...overrides,
});

describe('home catalog helpers', () => {
    it('exposes one tab for all tools and one for each available category', () => {
        const modes = getAvailableHomeModes([tool({ category: 'converters' })]);
        expect(modes).toEqual([{ mode: 'all', count: 1 }, { mode: 'converters', count: 1 }]);
        expect(modes.every(({ count }) => count > 0)).toBe(true);

        expect(getAvailableHomeModes([
            tool({ category: 'converters' }),
            tool({ category: 'generators', href: '/generator' }),
            tool({ category: 'other', href: '/other' }),
        ])).toEqual([
            { mode: 'all', count: 3 },
            { mode: 'converters', count: 1 },
            { mode: 'generators', count: 1 },
            { mode: 'other', count: 1 },
        ]);
    });

    it('resets every result-affecting filter to a valid all-tools state', () => {
        const reset = createHomeFilters();
        expect(reset).toEqual({ searchTerm: '', activeCategory: 'all', activeTag: '', activeMode: 'all' });
        expect(filterHomeTools([tool({ href: '/one' }), tool({ href: '/two', category: 'generators' })], reset)).toHaveLength(2);
    });

    it('applies a quick search as a search term while clearing incompatible filters', () => {
        const quickSearch = createHomeFilters('JSON → TS');
        expect(quickSearch).toEqual({ searchTerm: 'JSON → TS', activeCategory: 'all', activeTag: '', activeMode: 'all' });
        expect(filterHomeTools([tool({ title: 'JSON to TypeScript', href: '/json-to-typescript' })], quickSearch)).toHaveLength(1);
    });

    it('supports additional format tags from the homepage catalog', () => {
        const filters = { ...createHomeFilters(), activeTag: 'json schema' };
        expect(filterHomeTools([
            tool({ title: 'JSON Schema to TypeScript', href: '/json-schema-to-typescript' }),
            tool({ title: 'CSS to JS', href: '/css-to-js', subCategory: 'css' }),
        ], filters)).toEqual([
            expect.objectContaining({ href: '/json-schema-to-typescript' }),
        ]);
    });

    it('matches hyphenated registry categories from readable format tags', () => {
        const filters = { ...createHomeFilters(), activeTag: 'Date & Time' };
        expect(filterHomeTools([
            tool({ title: 'Unix Timestamp Converter', href: '/timestamp', subCategory: 'date-time' }),
            tool({ title: 'JSON Format', href: '/json-format', subCategory: 'json' }),
        ], filters)).toEqual([
            expect.objectContaining({ href: '/timestamp' }),
        ]);
    });

    it('preserves the complete registry and produces only registry-backed localized routes', () => {
        const catalog = Object.values(AllToolsList);
        const validRoutes = new Set(catalog.map((item) => item.href));
        expect(catalog).toHaveLength(validRoutes.size);
        expect(catalog.every((item) => item.href.startsWith('/'))).toBe(true);
        expect(catalog.every((item) => validRoutes.has(getHomeToolHref(item, 'en').replace(/^\/en/, '')))).toBe(true);
        expect(catalog.every((item) => validRoutes.has(getHomeToolHref(item, 'fa')))).toBe(true);
    });
});
