module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: '.',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // An array of regexp pattern strings that are matched against all source paths
  // before re-running tests in watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage 
  // information should be collected
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/scripts/**/*.js',
    '!src/tests/**/*.js',
    '!**/node_modules/**'
  ],

  // The test coverage threshold enforcement
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'clover',
    'html'
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // An array of regexp pattern strings that are matched against all source file paths
  // before transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$'
  ],

  // Setup files that will be run before each test
  setupFiles: [
    '<rootDir>/src/tests/setup.js'
  ],

  // Setup files that will be run after the test framework is installed in the environment
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setupAfterEnv.js'
  ],

  // The paths to modules that run some code to configure or set up the testing framework
  // before each test
  globalSetup: '<rootDir>/src/tests/globalSetup.js',

  // The paths to modules that run some code to configure or set up the testing framework
  // after each test
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js',

  // A list of paths to modules that run some code to configure or set up the testing 
  // environment before each test
  testEnvironment: 'node',

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],

  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Stop running tests after `n` failures
  bail: 5,

  // The number of seconds after which a test is considered as slow
  slowTestThreshold: 5,

  // A list of paths to snapshot serializer modules Jest should use
  snapshotSerializers: [],

  // Options that will be passed to the testEnvironment
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Run tests with specified reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage/junit',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],

  // Display individual test results with the test suite hierarchy
  displayName: {
    name: 'RETAIL-MANAGEMENT-API',
    color: 'blue'
  },

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/controllers/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/models/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/middleware/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Allows you to use a custom runner instead of Jest's default test runner
  runner: 'jest-runner',

  // The paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/src'
  ],

  // A list of paths to directories that Jest should use to search for test files
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/src/tests/fixtures/',
    '/src/tests/helpers/'
  ],

  // The regexp pattern Jest uses to detect test files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

  // This option sets the URL for the jsdom environment
  testURL: 'http://localhost',

  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  timers: 'fake',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
