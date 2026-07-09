import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '\\.(integration|e2e)\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}

export default config
