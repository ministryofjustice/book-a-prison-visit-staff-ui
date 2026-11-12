export default {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['server/**/*.{ts,js,jsx,mjs}'],
  testMatch: ['<rootDir>/(server|job)/**/?(*.)(cy|test).{ts,js,jsx,mjs}'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test_results/jest/',
      },
    ],
    [
      './node_modules/jest-html-reporter',
      {
        outputPath: 'test_results/unit-test-reports.html',
      },
    ],
  ],
  moduleFileExtensions: ['web.js', 'js', 'json', 'node', 'ts'],
}
