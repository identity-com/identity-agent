module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
};
