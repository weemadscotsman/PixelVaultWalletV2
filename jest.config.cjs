module.exports = {
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, diagnostics: false }]
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  extensionsToTreatAsEsm: ['.ts']
};
