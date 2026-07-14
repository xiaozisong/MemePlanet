/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2021',
          module: 'commonjs',
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverage: false,
};
