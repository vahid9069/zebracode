export function normalizeCommandSearch(value: string) {
    return value.trim().toLowerCase();
}

export function matchesCommandSearch(fields: string[], query: string) {
    const normalizedQuery = normalizeCommandSearch(query);
    if (!normalizedQuery) return true;

    return fields
        .filter(Boolean)
        .some(field => normalizeCommandSearch(field).includes(normalizedQuery));
}
