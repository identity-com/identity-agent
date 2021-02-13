import { queryablePromise } from '../../../src/lib/util';

describe('util', () => {
  describe('queryablePromise', () => {
    it('reports when not done', async () => {
      const promise = queryablePromise(new Promise(() => {}));

      expect(promise.isResolved()).toBeFalsy();
      expect(promise.isRejected()).toBeFalsy();
      expect(promise.isFulfilled()).toBeFalsy();
    });

    it('reports when done', async () => {
      const promise = queryablePromise(Promise.resolve());

      await promise;

      expect(promise.isResolved()).toBeTruthy();
      expect(promise.isRejected()).toBeFalsy();
      expect(promise.isFulfilled()).toBeTruthy();
    });

    it('reports when failed', async () => {
      const promise = queryablePromise(Promise.reject());

      await promise.catch(() => {});

      expect(promise.isResolved()).toBeFalsy();
      expect(promise.isRejected()).toBeTruthy();
      expect(promise.isFulfilled()).toBeTruthy();
    });
  });
});
