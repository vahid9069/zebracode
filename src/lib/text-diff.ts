export type DiffGranularity = 'line' | 'word' | 'char';
export type DiffOperationType = 'equal' | 'added' | 'removed';

export interface DiffOperation<T> {
    type: DiffOperationType;
    value: T;
}

export interface DiffRow {
    type: 'unchanged' | 'added' | 'removed' | 'modified';
    oldText?: string;
    newText?: string;
    oldLine?: number;
    newLine?: number;
    oldParts?: DiffOperation<string>[];
    newParts?: DiffOperation<string>[];
}

export const MAX_DIFF_TOKENS = 5000;
const MAX_EDIT_DISTANCE = 1200;

function tokenize(value: string, granularity: DiffGranularity): string[] {
    if (granularity === 'char') return Array.from(value);
    if (granularity === 'word') return value.match(/\s+|[^\s]+/gu) || [];
    return value.split('\n');
}

export function countDiffTokens(value: string, granularity: DiffGranularity): number {
    return tokenize(value, granularity).length;
}

function normalizeToken(value: string, ignoreWhitespace: boolean, caseSensitive: boolean): string {
    let normalized = ignoreWhitespace ? value.replace(/\s+/gu, '') : value;
    if (!caseSensitive) normalized = normalized.toLocaleLowerCase();
    return normalized;
}

function myersDiff<T>(
    oldItems: T[],
    newItems: T[],
    equals: (oldItem: T, newItem: T) => boolean
): DiffOperation<T>[] {
    let prefixLength = 0;
    while (
        prefixLength < oldItems.length &&
        prefixLength < newItems.length &&
        equals(oldItems[prefixLength], newItems[prefixLength])
    ) prefixLength++;

    let suffixLength = 0;
    while (
        suffixLength < oldItems.length - prefixLength &&
        suffixLength < newItems.length - prefixLength &&
        equals(oldItems[oldItems.length - suffixLength - 1], newItems[newItems.length - suffixLength - 1])
    ) suffixLength++;

    const oldMiddle = oldItems.slice(prefixLength, oldItems.length - suffixLength);
    const newMiddle = newItems.slice(prefixLength, newItems.length - suffixLength);
    const middleResult = myersMiddle(oldMiddle, newMiddle, equals);
    const prefix = oldItems.slice(0, prefixLength).map(value => ({ type: 'equal' as const, value }));
    const suffix = oldItems.slice(oldItems.length - suffixLength).map(value => ({ type: 'equal' as const, value }));
    return [...prefix, ...middleResult, ...suffix];
}

function myersMiddle<T>(
    oldItems: T[],
    newItems: T[],
    equals: (oldItem: T, newItem: T) => boolean
): DiffOperation<T>[] {
    const oldLength = oldItems.length;
    const newLength = newItems.length;
    const frontier = new Map<number, number>([[1, 0]]);
    const trace: Map<number, number>[] = [];

    for (let distance = 0; distance <= Math.min(oldLength + newLength, MAX_EDIT_DISTANCE); distance++) {
        trace.push(new Map(frontier));
        for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
            let oldIndex: number;
            if (
                diagonal === -distance ||
                (diagonal !== distance && (frontier.get(diagonal - 1) ?? -1) < (frontier.get(diagonal + 1) ?? -1))
            ) {
                oldIndex = frontier.get(diagonal + 1) ?? 0;
            } else {
                oldIndex = (frontier.get(diagonal - 1) ?? 0) + 1;
            }
            let newIndex = oldIndex - diagonal;

            while (
                oldIndex < oldLength &&
                newIndex < newLength &&
                equals(oldItems[oldIndex], newItems[newIndex])
            ) {
                oldIndex++;
                newIndex++;
            }
            frontier.set(diagonal, oldIndex);

            if (oldIndex >= oldLength && newIndex >= newLength) {
                return backtrackMyers(trace, oldItems, newItems, distance);
            }
        }
    }
    return [
        ...oldItems.map(value => ({ type: 'removed' as const, value })),
        ...newItems.map(value => ({ type: 'added' as const, value })),
    ];
}

function backtrackMyers<T>(
    trace: Map<number, number>[],
    oldItems: T[],
    newItems: T[],
    distance: number
): DiffOperation<T>[] {
    let oldIndex = oldItems.length;
    let newIndex = newItems.length;
    const result: DiffOperation<T>[] = [];

    for (let currentDistance = distance; currentDistance >= 0; currentDistance--) {
        const frontier = trace[currentDistance];
        const diagonal = oldIndex - newIndex;
        const previousDiagonal =
            diagonal === -currentDistance ||
            (diagonal !== currentDistance &&
                (frontier.get(diagonal - 1) ?? -1) < (frontier.get(diagonal + 1) ?? -1))
                ? diagonal + 1
                : diagonal - 1;
        const previousOldIndex = currentDistance === 0 ? 0 : frontier.get(previousDiagonal) ?? 0;
        const previousNewIndex = previousOldIndex - previousDiagonal;

        while (oldIndex > previousOldIndex && newIndex > previousNewIndex) {
            result.push({ type: 'equal', value: oldItems[oldIndex - 1] });
            oldIndex--;
            newIndex--;
        }
        if (currentDistance === 0) break;
        if (oldIndex === previousOldIndex) {
            result.push({ type: 'added', value: newItems[newIndex - 1] });
            newIndex--;
        } else {
            result.push({ type: 'removed', value: oldItems[oldIndex - 1] });
            oldIndex--;
        }
    }
    return result.reverse();
}

function inlineDiff(
    oldText: string,
    newText: string,
    granularity: DiffGranularity,
    ignoreWhitespace: boolean,
    caseSensitive: boolean
) {
    const inlineGranularity = granularity === 'char' ? 'char' : 'word';
    const oldParts = tokenize(oldText, inlineGranularity);
    const newParts = tokenize(newText, inlineGranularity);
    const equals = (a: string, b: string) =>
        normalizeToken(a, ignoreWhitespace, caseSensitive) === normalizeToken(b, ignoreWhitespace, caseSensitive);
    const operations = myersDiff(oldParts, newParts, equals);
    const inverseOperations = myersDiff(newParts, oldParts, equals);
    return {
        oldParts: operations.filter(operation => operation.type !== 'added'),
        newParts: inverseOperations
            .filter(operation => operation.type !== 'added')
            .map(operation => ({ ...operation, type: operation.type === 'removed' ? 'added' as const : 'equal' as const })),
    };
}

export function buildDiffRows(
    oldText: string,
    newText: string,
    granularity: DiffGranularity,
    ignoreWhitespace: boolean,
    caseSensitive: boolean
): DiffRow[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const lineOperations = myersDiff(oldLines, newLines, (a, b) =>
        normalizeToken(a, ignoreWhitespace, caseSensitive) === normalizeToken(b, ignoreWhitespace, caseSensitive)
    );
    const rows: DiffRow[] = [];
    let oldLine = 0;
    let newLine = 0;
    let index = 0;

    while (index < lineOperations.length) {
        const operation = lineOperations[index];
        if (operation.type === 'equal') {
            oldLine++;
            newLine++;
            rows.push({ type: 'unchanged', oldText: operation.value, newText: newLines[newLine - 1], oldLine, newLine });
            index++;
            continue;
        }

        const removed: string[] = [];
        const added: string[] = [];
        while (index < lineOperations.length && lineOperations[index].type !== 'equal') {
            const changed = lineOperations[index];
            if (changed.type === 'removed') {
                removed.push(changed.value);
                oldLine++;
            } else {
                added.push(changed.value);
                newLine++;
            }
            index++;
        }

        const pairedCount = Math.min(removed.length, added.length);
        for (let pair = 0; pair < pairedCount; pair++) {
            const oldTextLine = removed[pair];
            const newTextLine = added[pair];
            const inline = granularity === 'line'
                ? { oldParts: [{ type: 'removed' as const, value: oldTextLine }], newParts: [{ type: 'added' as const, value: newTextLine }] }
                : inlineDiff(oldTextLine, newTextLine, granularity, ignoreWhitespace, caseSensitive);
            rows.push({
                type: 'modified',
                oldText: oldTextLine,
                newText: newTextLine,
                oldLine: oldLine - removed.length + pair + 1,
                newLine: newLine - added.length + pair + 1,
                ...inline,
            });
        }
        for (let removedIndex = pairedCount; removedIndex < removed.length; removedIndex++) {
            rows.push({
                type: 'removed',
                oldText: removed[removedIndex],
                oldLine: oldLine - removed.length + removedIndex + 1,
            });
        }
        for (let addedIndex = pairedCount; addedIndex < added.length; addedIndex++) {
            rows.push({
                type: 'added',
                newText: added[addedIndex],
                newLine: newLine - added.length + addedIndex + 1,
            });
        }
    }
    return rows;
}
