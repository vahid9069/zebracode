import { writeFileSync } from 'fs';
import { AllToolsList } from '../src/lib/registry/tools';
import faToolTranslations from '../src/dictionaries/fa/tools.json';
import enToolTranslations from '../src/dictionaries/en/tools.json';

const tools = Object.entries(AllToolsList).map(([toolKey, tool]) => {
    const faCopy = faToolTranslations[toolKey as keyof typeof faToolTranslations];
    const enCopy = enToolTranslations[toolKey as keyof typeof enToolTranslations];
    return {
        path: tool.href.replace(/^\/+|\/+$/g, ''),
        titleFa: faCopy?.title || tool.title,
        descriptionFa: faCopy?.shortDescription || faCopy?.description || tool.shortDescription,
        titleEn: enCopy?.title || tool.title,
        descriptionEn: enCopy?.shortDescription || enCopy?.description || tool.shortDescription,
    };
});

writeFileSync('scripts/tools.json', JSON.stringify(tools, null, 2), 'utf8');
console.log('tools.json generated');