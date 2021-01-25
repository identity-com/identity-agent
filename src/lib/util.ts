import { complement, isNil, pickBy } from 'ramda';

export const filterOutMissingProps = pickBy(complement(isNil));
