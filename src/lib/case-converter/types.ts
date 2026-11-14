export type CaseStyleId =
    | 'camel'
    | 'pascal'
    | 'snake'
    | 'kebab'
    | 'constant'
    | 'title'
    | 'sentence'
    | 'upper'
    | 'lower'
    | 'dot'
    | 'path'
    | 'train'
    | 'alternating'
    | 'inverted';

export interface CaseStyleDefinition {
    id: CaseStyleId;
    labelFa: string;
    labelEn: string;
    descriptionFa: string;
    descriptionEn: string;
    example: string;
    category: 'code' | 'text' | 'fun';
}

export interface CaseResultItem {
    id: CaseStyleId;
    label: string;
    value: string;
    description: string;
    category: 'code' | 'text' | 'fun';
}

export interface TextStatistics {
    charactersWithSpaces: number;
    charactersWithoutSpaces: number;
    words: number;
    lines: number;
    paragraphs: number;
    readingTimeSeconds: number;
}
