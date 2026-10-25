import { developerDefinitions } from './definitions';
import { DeveloperToolError } from './types';
import { UTILITY_OUTPUT_LIMIT, validateUtilityValues } from './limits';

const allowed = new Set(['jsonpath-tester', 'sql-formatter', 'yaml-formatter', 'openapi-validator',
    'json-schema-validator', 'docker-compose-validator', 'svg-optimizer']);

self.onmessage = async (event: MessageEvent<{ slug: string; values: Record<string, string> }>) => {
    try {
        const { slug, values } = event.data;
        const tool = allowed.has(slug) && developerDefinitions.find(item => item.slug === slug);
        if (!tool) throw new DeveloperToolError('unsupported');
        validateUtilityValues(values);
        const output = await tool.run(values);
        if (output.length > UTILITY_OUTPUT_LIMIT) throw new DeveloperToolError('outputLimit');
        self.postMessage({ output });
    } catch (error) {
        self.postMessage({ error: error instanceof DeveloperToolError ? error.code : 'unexpected' });
    }
};
