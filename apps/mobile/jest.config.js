/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.tsx', '**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['./jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, module: 'commonjs', target: 'ES2021', types: ['react', 'jest'] } },
    ],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.tsx',
    '^react-native-safe-area-context$': '<rootDir>/__mocks__/react-native-safe-area-context.tsx',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.tsx',
    '^expo-router$': '<rootDir>/__mocks__/expo-router.tsx',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.tsx',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.tsx',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.tsx',
    '^expo-device$': '<rootDir>/__mocks__/expo-device.tsx',
  },
  testTimeout: 30000,
  verbose: true,
};
