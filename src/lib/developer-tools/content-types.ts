/** Static, localized, publicly visible content. Never include visitor input or credentials. */
export interface DeveloperToolContent {
    seoTitle: string;
    metaDescription: string;
    answer: string;
    steps: string[];
    useCases: string[];
    limitations: string[];
    example: { input: string; output: string };
    faq: { question: string; answer: string }[];
    relatedSlugs: string[];
    references?: { label: string; url: string }[];
}

export type DeveloperToolContentCatalog = Record<string, DeveloperToolContent>;
