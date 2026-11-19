import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '\\.(integration|e2e)\\.spec\\.ts$'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

export default config;
