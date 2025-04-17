module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'jest'
  ],
  rules: {
    // Customized rules
    'no-console': 'off', // Allow console for logging
    'camelcase': 'off', // Allow snake_case for database columns
    'no-underscore-dangle': ['error', { 
      allow: ['_checkExists', '_success', '_buildFilterCriteria', '_buildSearchCriteria', '_buildOperatorCriteria', '_buildOrderCriteria'] 
    }],
    'class-methods-use-this': 'off', // Allow non-static class methods
    'no-param-reassign': ['error', { 
      props: false 
    }],
    'max-len': ['error', { 
      code: 120,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.test.js',
        '**/*.spec.js',
        'src/tests/**',
        'src/scripts/**'
      ]
    }],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never'
    }],
    'object-curly-newline': ['error', {
      ObjectExpression: { 
        multiline: true, 
        consistent: true 
      },
      ObjectPattern: { 
        multiline: true, 
        consistent: true 
      }
    }],
    'arrow-parens': ['error', 'as-needed'],
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src']
      }
    }
  },
  overrides: [
    {
      files: ['src/scripts/**'],
      rules: {
        'no-process-exit': 'off'
      }
    },
    {
      files: ['src/tests/**'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    '*.min.js'
  ]
};
