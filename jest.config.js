module.exports = {
  maxWorkers: 1, // the tests share a scratch folder that prevents concurrent tests (TODO replace with inmemory?)
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  modulePathIgnorePatterns: ["examples"],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  setupFiles: ['./test/setup/clearScratch.ts',  './test/setup/transport.ts']
};
