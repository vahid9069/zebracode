export type CategorySlug = 'data' | 'development' | 'security' | 'network' | 'productivity' | (string & {});
export type CoverStyle = 'json' | 'code' | 'security' | 'network' | 'text' | 'terminal';

export interface Category {
    slug: CategorySlug;
    name: string;
    description: string;
    symbol: string;
    count?: number;
}

export type InlineToken =
    | { type: 'text'; text: string }
    | { type: 'bold'; text: string }
    | { type: 'code'; text: string }
    | { type: 'link'; text: string; href: string; isExternal?: boolean };

export type ArticleBlock =
    | { type: 'paragraph'; text: string; tokens?: InlineToken[] }
    | { type: 'heading'; id: string; title: string; level?: 2 | 3 }
    | { type: 'list'; items: string[]; ordered?: boolean; itemTokens?: InlineToken[][] }
    | { type: 'code'; language: string; code: string; caption?: string }
    | { type: 'callout'; title: string; text: string; tone?: 'note' | 'warning' }
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'image'; url: string; alt: string; caption?: string };

export interface ToolLink { slug: string; title: string; description: string; url?: string; domain?: string }
export interface Author { name: string; role: string; bio: string; initials: string; avatarUrl?: string }

export interface FeaturedImage {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
}

export interface RankMathSeo {
    title?: string;
    description?: string;
    focusKeyword?: string;
    canonicalUrl?: string;
    robots?: string[];
    isNoindex?: boolean;
    isNofollow?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
}

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
    featuredImage?: FeaturedImage;
    seo?: RankMathSeo;
}

export interface AdCampaign {
    id: string;
    title: string;
    active: boolean;
    ad_type: 'image' | 'script' | 'native';
    placement: string;
    paragraph_number?: number;
    priority?: number;
    image_url?: string;
    mobile_image_url?: string;
    target_url?: string;
    alt_text?: string;
    utm_campaign?: string;
    open_new_tab?: boolean;
    script_code?: string;
    badge_text?: string;
    headline?: string;
    description?: string;
    cta_text?: string;
    target_categories?: string[];
    include_posts?: string;
    exclude_posts?: string;
    device?: 'all' | 'desktop' | 'mobile';
    start_date?: string;
    end_date?: string;
}

export interface PostComment {
    id: number;
    parentId: number;
    authorName: string;
    avatarUrl?: string;
    content: string;
    date: string;
    isAdmin?: boolean;
}

export interface SiteSocialLinks {
    telegram?: string;
    bale?: string;
    rubika?: string;
    github?: string;
}

export interface Post extends PostSummary {
    blocks: ArticleBlock[];
    tools: ToolLink[];
    faq: { question: string; answer: string }[];
    references: { label: string; url: string }[];
    metaDescription?: string;
    disableAds?: boolean;
    ads?: AdCampaign[];
    comments?: PostComment[];
}
