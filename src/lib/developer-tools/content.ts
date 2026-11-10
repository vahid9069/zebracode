import type { DeveloperToolContent, DeveloperToolContentCatalog } from './content-types';
import enOne from '@/dictionaries/en/developer-content-one.json';
import enTwo from '@/dictionaries/en/developer-content-two.json';
import faOne from '@/dictionaries/fa/developer-content-one.json';
import faTwo from '@/dictionaries/fa/developer-content-two.json';

/** Used by server routes and export scripts only; not passed into the interactive workbench. */
export const developerContent: Record<'en' | 'fa', DeveloperToolContentCatalog> = {
    en: { ...enOne, ...enTwo },
    fa: { ...faOne, ...faTwo },
};

export function getDeveloperToolContent(slug: string, locale: 'fa' | 'en'): DeveloperToolContent | undefined {
    return developerContent[locale][slug];
}
