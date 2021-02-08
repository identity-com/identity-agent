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

export type QueryablePromise<T> = Promise<T> & {
  isFulfilled: () => boolean;
  isResolved: () => boolean;
  isRejected: () => boolean;
};

const isQueryable = <T>(
  promise: Promise<T> | QueryablePromise<T>
): promise is QueryablePromise<T> => {
  return Object.prototype.hasOwnProperty.call(promise, 'isResolved');
};

export const queryablePromise = <T>(
  promise: Promise<T> | QueryablePromise<T>
): QueryablePromise<T> => {
  if (isQueryable(promise)) return promise;

  let isResolved = false;
  let isRejected = false;

  // Observe the promise, saving the fulfillment in a closure scope.
  const result = promise.then(
    (value) => {
      isResolved = true;
      return value;
    },
    (error) => {
      isRejected = true;
      throw error;
    }
  ) as QueryablePromise<T>;
  result.isFulfilled = () => isResolved || isRejected;
  result.isResolved = () => isResolved;
  result.isRejected = () => isRejected;
  return result;
};
