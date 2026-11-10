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

export interface ToolFAQ {
  question: string;
  answer: string;
}

export type CommonDictionary = Omit<typeof import("@/dictionaries/fa/common.json"), 'faqByTool'> & {
  faqByTool?: Record<string, ToolFAQ[]>;
};

export interface Dictionary {
  layout: typeof import("@/dictionaries/fa/layout.json");
  home: typeof import("@/dictionaries/fa/home.json");
  about: typeof import("@/dictionaries/fa/about.json");
  tools: Record<string, ToolStrings>;
  developerTools: DeveloperToolCopies;
  developerUi: typeof import("@/dictionaries/fa/developer-ui.json");
  categories: typeof import("@/dictionaries/fa/categories.json");
  common: CommonDictionary;
}

const dictionaries = {
  fa: async (): Promise<Dictionary> => ({
    layout: (await import("@/dictionaries/fa/layout.json")).default,
    home: (await import("@/dictionaries/fa/home.json")).default,
    about: (await import("@/dictionaries/fa/about.json")).default,
    tools: mergeTools((await import("@/dictionaries/fa/tools.json")).default, await developerCopy('fa')),
    developerTools: await developerCopy('fa'),
    developerUi: (await import('@/dictionaries/fa/developer-ui.json')).default,
    categories: (await import("@/dictionaries/fa/categories.json")).default,
    common: (await import("@/dictionaries/fa/common.json")).default as CommonDictionary,
  }),
  en: async (): Promise<Dictionary> => ({
    layout: (await import("@/dictionaries/en/layout.json")).default,
    home: (await import("@/dictionaries/en/home.json")).default,
    about: (await import("@/dictionaries/en/about.json")).default,
    tools: mergeTools((await import("@/dictionaries/en/tools.json")).default, await developerCopy('en')),
    developerTools: await developerCopy('en'),
    developerUi: (await import('@/dictionaries/en/developer-ui.json')).default,
    categories: (await import("@/dictionaries/en/categories.json")).default,
    common: (await import("@/dictionaries/en/common.json")).default as CommonDictionary,
  }),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
