import { Braces, Fingerprint, ScanSearch, ShieldCheck, WandSparkles } from 'lucide-react';
import type { ToolMeta } from '@/types/types';
import { developerTools } from '@/lib/developer-tools';
import type { DeveloperToolCopies } from '@/lib/developer-tools/types';
import { DeveloperToolError } from '@/lib/developer-tools/types';
import phaseOne from '@/dictionaries/en/developer-phase-one.json';
import phaseTwo from '@/dictionaries/en/developer-phase-two.json';
import phaseThree from '@/dictionaries/en/developer-phase-three.json';

const copies: DeveloperToolCopies = { ...phaseOne, ...phaseTwo, ...phaseThree };
const icons = { converters: Braces, generators: WandSparkles, validators: ShieldCheck, inspectors: ScanSearch };

/** One registry entry per descriptor; localized copy is merged by getDictionary. */
export const DeveloperToolsList: Record<string, ToolMeta> = Object.fromEntries(developerTools.map(tool => {
    const { title, shortDescription, description } = copies[tool.slug];
    return [tool.slug, {
        type: tool.slug,
        category: tool.category,
        subCategory: tool.subCategory,
        title, shortDescription, description,
        icon: tool.slug === 'uuid-generator' ? Fingerprint : icons[tool.category],
        href: `/${tool.slug}/`,
        inputLanguage: 'text',
        outputLanguage: tool.outputExtension || 'json',
        sampleCodeSimple: tool.sample.input || tool.sample.document || '',
        // Multi-field utilities must not silently transform sample data via the legacy API.
        transformFunction: () => { throw new DeveloperToolError('unsupported'); },
    }];
}));
