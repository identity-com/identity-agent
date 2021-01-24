module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  modulePathIgnorePatterns: ["examples"],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  setupFiles: ['./test/setup/clearScratch.ts']
};
