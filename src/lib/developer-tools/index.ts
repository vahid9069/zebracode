import { developerDefinitions } from './definitions';
import { runIsolated, validateUtilityValues } from './isolation';

const isolated = new Set(['jsonpath-tester', 'sql-formatter', 'yaml-formatter', 'openapi-validator',
    'json-schema-validator', 'docker-compose-validator', 'svg-optimizer']);

export const developerTools = developerDefinitions.map(tool => ({ ...tool,
    run(values: Record<string, string>, signal?: AbortSignal) {
        validateUtilityValues(values);
        return isolated.has(tool.slug) ? runIsolated(tool.slug, values, signal) : tool.run(values, signal);
    },
}));

export function getDeveloperTool(slug: string) {
    return developerTools.find(tool => tool.slug === slug);
}
