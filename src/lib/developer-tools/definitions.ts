import { phaseOneTools } from './phase-one';
import { phaseTwoTools } from './phase-two';
import { phaseThreeTools } from './phase-three';

/** Raw engines shared with the isolated worker; no registry or UI imports. */
export const developerDefinitions = [...phaseOneTools, ...phaseTwoTools, ...phaseThreeTools];
