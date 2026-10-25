/** Local-only utility contract. All field values are strings, including numbers. */
export interface DeveloperField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'password';
    options?: string[];
    min?: number;
    max?: number;
}

export interface DeveloperToolDefinition {
    slug: string;
    category: 'converters' | 'generators' | 'validators' | 'inspectors';
    subCategory: string;
    fields: DeveloperField[];
    sample: Record<string, string>;
    outputExtension?: string;
    run: (values: Record<string, string>, signal?: AbortSignal) => string | Promise<string>;
}

export interface DeveloperToolCopy {
    title: string;
    shortDescription: string;
    description: string;
    fields: Record<string, string>;
    options?: Record<string, string>;
    note?: string;
    errors?: Record<string, string>;
}

export type DeveloperToolCopies = Record<string, DeveloperToolCopy>;

/** Errors must never include user input or key material. */
export class DeveloperToolError extends Error {
    constructor(public readonly code: string) {
        super(code);
        this.name = 'DeveloperToolError';
    }
}
