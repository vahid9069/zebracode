export interface Dictionary {
  common: typeof import("@/dictionaries/fa/common.json");
  categories: typeof import("@/dictionaries/fa/categories.json");
  tools: typeof import("@/dictionaries/fa/tools.json");
}

const dictionaries = {
  fa: async (): Promise<Dictionary> => ({
    common: (await import("@/dictionaries/fa/common.json")).default,
    categories: (await import("@/dictionaries/fa/categories.json")).default,
    tools: (await import("@/dictionaries/fa/tools.json")).default,
  }),
  en: async (): Promise<Dictionary> => ({
    common: (await import("@/dictionaries/en/common.json")).default,
    categories: (await import("@/dictionaries/en/categories.json")).default,
    tools: (await import("@/dictionaries/en/tools.json")).default,
  }),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale = 'fa'): Promise<Dictionary> => {
  return dictionaries[locale] ? dictionaries[locale]() : dictionaries.fa();
};
