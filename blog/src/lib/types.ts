export type CategorySlug = 'data' | 'development' | 'security' | 'network' | 'productivity';
export type CoverStyle = 'json' | 'code' | 'security' | 'network' | 'text' | 'terminal';

export interface Category {
    slug: CategorySlug;
    name: string;
    description: string;
    symbol: string;
}

export type ArticleBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; id: string; title: string }
    | { type: 'list'; items: string[] }
    | { type: 'code'; language: string; code: string; caption?: string }
    | { type: 'callout'; title: string; text: string; tone?: 'note' | 'warning' }
    | { type: 'table'; headers: string[]; rows: string[][] };

export interface ToolLink { slug: string; title: string; description: string }
export interface Author { name: string; role: string; bio: string; initials: string }

export interface PostSummary {
    slug: string;
    title: string;
    excerpt: string;
    category: CategorySlug;
    kind: 'guide' | 'concept' | 'comparison';
    level: 'beginner' | 'intermediate';
    publishedAt: string;
    updatedAt?: string;
    readingMinutes: number;
    featured: boolean;
    cover: CoverStyle;
    tags: string[];
    author: Author;
}

export interface Post extends PostSummary {
    blocks: ArticleBlock[];
    tools: ToolLink[];
    faq: { question: string; answer: string }[];
    references: { label: string; url: string }[];
    metaDescription?: string;
}
