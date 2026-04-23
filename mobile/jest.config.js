module.exports = {
  preset: 'jest-expo',
  testPathPattern: ['__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
