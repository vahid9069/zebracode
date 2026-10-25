import { DeveloperToolError } from './types';

export const REGEX_INPUT_LIMIT = 100_000;
export const REGEX_PATTERN_LIMIT = 2_000;
export const REGEX_MATCH_LIMIT = 1_000;

export interface RegexRequest {
    pattern: string;
    flags: string;
    input: string;
}

export function validateRegexRequest(values: RegexRequest): void {
    if (values.input.length > REGEX_INPUT_LIMIT || values.pattern.length > REGEX_PATTERN_LIMIT) {
        throw new DeveloperToolError('inputLimit');
    }
    if (!/^[dgimsuvy]*$/.test(values.flags) || new Set(values.flags).size !== values.flags.length) {
        throw new DeveloperToolError('regexInvalid');
    }
}

/** Only invoke in an isolated worker; even a short pattern can take unbounded time. */
export function evaluateRegex(values: RegexRequest): string {
    validateRegexRequest(values);
    let regex: RegExp;
    try {
        regex = new RegExp(values.pattern, values.flags);
    } catch {
        throw new DeveloperToolError('regexInvalid');
    }
    const matches = [];
    let outputBudget = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(values.input)) !== null) {
        if (matches.length >= REGEX_MATCH_LIMIT) throw new DeveloperToolError('outputLimit');
        for (const group of match) outputBudget += (group?.length ?? 0) + 32;
        for (const group of Object.values(match.groups ?? {})) outputBudget += (group?.length ?? 0) + 32;
        if (outputBudget > 1_000_000) throw new DeveloperToolError('outputLimit');
        matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1).map(group => group ?? null),
            namedGroups: match.groups ?? null,
            ...(match.indices ? { indices: match.indices } : {}),
        });
        if (!regex.global && !regex.sticky) break;
        if (match[0] === '') {
            // AdvanceStringIndex: do not split surrogate pairs in Unicode mode.
            const index = regex.lastIndex;
            const first = values.input.charCodeAt(index);
            const second = values.input.charCodeAt(index + 1);
            regex.lastIndex += (regex.unicode || values.flags.includes('v'))
                && first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff ? 2 : 1;
        }
    }
    return JSON.stringify({ count: matches.length, matches }, null, 2);
}
