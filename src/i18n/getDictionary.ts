import "server-only";

const dictionaries = {
  fa: async () => ({
    layout: (await import("@/dictionaries/fa/layout.json")).default,
    home: (await import("@/dictionaries/fa/home.json")).default,
    about: (await import("@/dictionaries/fa/about.json")).default,
    tools: (await import("@/dictionaries/fa/tools.json")).default,
    categories: (await import("@/dictionaries/fa/categories.json")).default,
    common: (await import("@/dictionaries/fa/common.json")).default,
  }),
  en: async () => ({
    layout: (await import("@/dictionaries/en/layout.json")).default,
    home: (await import("@/dictionaries/en/home.json")).default,
    about: (await import("@/dictionaries/en/about.json")).default,
    tools: (await import("@/dictionaries/en/tools.json")).default,
    categories: (await import("@/dictionaries/en/categories.json")).default,
    common: (await import("@/dictionaries/en/common.json")).default,
  }),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["fa"]>>;
export type ToolStrings = Dictionary["tools"][string];

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};