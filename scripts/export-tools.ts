import { writeFileSync } from 'fs';
import { AllToolsList } from '../src/lib/registry/tools';
import faToolTranslations from '../src/dictionaries/fa/tools.json';
import enToolTranslations from '../src/dictionaries/en/tools.json';
import faOne from '../src/dictionaries/fa/developer-phase-one.json';
import faTwo from '../src/dictionaries/fa/developer-phase-two.json';
import faThree from '../src/dictionaries/fa/developer-phase-three.json';
import enOne from '../src/dictionaries/en/developer-phase-one.json';
import enTwo from '../src/dictionaries/en/developer-phase-two.json';
import enThree from '../src/dictionaries/en/developer-phase-three.json';
import { getDeveloperToolContent } from '../src/lib/developer-tools/content';

type Copy = { title: string; shortDescription: string; description: string };
const faCopies: Record<string, Copy> = { ...faToolTranslations, ...faOne, ...faTwo, ...faThree };
const enCopies: Record<string, Copy> = { ...enToolTranslations, ...enOne, ...enTwo, ...enThree };

const tools = Object.entries(AllToolsList).map(([toolKey, tool]) => {
    const faCopy = faCopies[toolKey];
    const enCopy = enCopies[toolKey];
    const slug = tool.href.split('/').filter(Boolean).pop() || toolKey;
    const faContent = getDeveloperToolContent(slug, 'fa');
    const enContent = getDeveloperToolContent(slug, 'en');
    return {
        path: tool.href.replace(/^\/+|\/+$/g, ''),
        titleFa: faCopy?.title || tool.title,
        descriptionFa: faContent?.metaDescription || faCopy?.shortDescription || faCopy?.description || tool.shortDescription,
        titleEn: enCopy?.title || tool.title,
        descriptionEn: enContent?.metaDescription || enCopy?.shortDescription || enCopy?.description || tool.shortDescription,
    };
});

writeFileSync('scripts/tools.json', JSON.stringify(tools, null, 2), 'utf8');
console.log('tools.json generated');
