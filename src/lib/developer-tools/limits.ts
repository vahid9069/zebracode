import { DeveloperToolError } from './types';

export const UTILITY_INPUT_LIMIT = 200_000;
export const UTILITY_OUTPUT_LIMIT = 2_000_000;

export function validateUtilityValues(values: Record<string, string>) {
    if (Object.values(values).some(value => typeof value !== 'string' || value.length > UTILITY_INPUT_LIMIT)) {
        throw new DeveloperToolError('inputLimit');
    }
}
