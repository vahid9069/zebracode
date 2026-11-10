import "server-only";
import type { DeveloperToolCopies } from '@/lib/developer-tools/types';

export interface ToolStrings {
  title: string;
  shortDescription: string;
  description: string;
  secondaryInputTitle?: string;
}

function mergeTools(base: Record<string, ToolStrings>, extra: DeveloperToolCopies): Record<string, ToolStrings> {
  return { ...base, ...Object.fromEntries(Object.entries(extra).map(([slug, copy]) => [slug, {
    title: copy.title, shortDescription: copy.shortDescription, description: copy.description,
  }])) };
}

async function developerCopy(locale: 'fa' | 'en'): Promise<DeveloperToolCopies> {
  if (locale === 'en') return {
    ...(await import('@/dictionaries/en/developer-phase-one.json')).default,
    ...(await import('@/dictionaries/en/developer-phase-two.json')).default,
    ...(await import('@/dictionaries/en/developer-phase-three.json')).default,
  };
  return {
    ...(await import('@/dictionaries/fa/developer-phase-one.json')).default,
    ...(await import('@/dictionaries/fa/developer-phase-two.json')).default,
    ...(await import('@/dictionaries/fa/developer-phase-three.json')).default,
  };
}

const dictionaries = {
  fa: async () => ({
    layout: (await import("@/dictionaries/fa/layout.json")).default,
    home: (await import("@/dictionaries/fa/home.json")).default,
    about: (await import("@/dictionaries/fa/about.json")).default,
    tools: mergeTools((await import("@/dictionaries/fa/tools.json")).default, await developerCopy('fa')),
    developerTools: await developerCopy('fa'),
    developerUi: (await import('@/dictionaries/fa/developer-ui.json')).default,
    categories: (await import("@/dictionaries/fa/categories.json")).default,
    common: (await import("@/dictionaries/fa/common.json")).default,
  }),
  en: async () => ({
    layout: (await import("@/dictionaries/en/layout.json")).default,
    home: (await import("@/dictionaries/en/home.json")).default,
    about: (await import("@/dictionaries/en/about.json")).default,
    tools: mergeTools((await import("@/dictionaries/en/tools.json")).default, await developerCopy('en')),
    developerTools: await developerCopy('en'),
    developerUi: (await import('@/dictionaries/en/developer-ui.json')).default,
    categories: (await import("@/dictionaries/en/categories.json")).default,
    common: (await import("@/dictionaries/en/common.json")).default,
  }),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["fa"]>>;

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};
