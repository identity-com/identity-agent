import { complement, isNil, pickBy } from 'ramda';

export const filterOutMissingProps = pickBy(complement(isNil));

export const safeParseJSON = (
  string: string
): Record<string, any> | undefined => {
  try {
    return JSON.parse(string);
  } catch (error) {
    return undefined;
  }
};
