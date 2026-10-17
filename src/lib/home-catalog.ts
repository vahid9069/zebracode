import type { ToolMeta } from '@/types/types';

export type HomeMode = 'all' | string;
export interface HomeFilters {
    searchTerm: string;
    activeCategory: string;
    activeTag: string;
    activeMode: HomeMode;
}

export function createHomeFilters(searchTerm = ''): HomeFilters {
    return { searchTerm, activeCategory: 'all', activeTag: '', activeMode: 'all' };
}

export function matchesHomeMode(tool: ToolMeta, mode: HomeMode) {
    return mode === 'all' || tool.category === mode;
}

export function getAvailableHomeModes(tools: readonly ToolMeta[]) {
    const categories = Array.from(new Set(tools.map((tool) => tool.category || 'other')));
    const orderedCategories = categories.sort((first, second) => {
        const priority = (category: string) => category === 'converters' ? 0 : category === 'generators' ? 1 : 2;
        return priority(first) - priority(second) || first.localeCompare(second);
    });

    return (['all', ...orderedCategories] as HomeMode[])
        .map((mode) => ({ mode, count: tools.filter((tool) => matchesHomeMode(tool, mode)).length }));
}

export function filterHomeTools(
    tools: readonly ToolMeta[],
    filters: HomeFilters,
    localize: (tool: ToolMeta) => ToolMeta = (tool) => tool,
) {
    const aliases: Record<string, string> = { ts: 'typescript', js: 'javascript', gql: 'graphql' };
    const normalizeFilterText = (value: string) => value
        .toLowerCase()
        .replace(/[&/_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const terms = filters.searchTerm.trim().toLowerCase().replace(/→/g, ' ').split(/\s+/)
        .filter(Boolean).map((term) => aliases[term] || term);
    return tools.filter((tool) => {
        const localized = localize(tool);
        // Keep technical English names searchable in both locales.
        const text = [localized.title, localized.shortDescription, localized.description,
            tool.title, tool.category, tool.subCategory, tool.type, tool.href]
            .filter(Boolean).join(' ').toLowerCase();
        return (filters.activeCategory === 'all' || tool.category === filters.activeCategory)
            && matchesHomeMode(tool, filters.activeMode)
            && (!filters.activeTag || normalizeFilterText(text).includes(normalizeFilterText(filters.activeTag)))
            && terms.every((term) => text.includes(term));
    });
}

export const getHomeToolHref = (tool: ToolMeta, locale: 'fa' | 'en') =>
    `${locale === 'en' ? '/en' : ''}${tool.href}`;
