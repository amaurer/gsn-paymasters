module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    mocha: true,
    node: true
  },
  globals: {
    artifacts: false,
    assert: false,
    contract: false,
    web3: false
  },
  extends:
    [
      'standard-with-typescript'
    ],
  // This is needed to add configuration to rules with type information
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // The 'tsconfig.eslint.json' is needed to add all JavaScript files to the project
    project: ['./tsconfig.json', './tsconfig.eslint.json']
  },
  ignorePatterns: [
    'gsn/',
    'dist/',
    'types/'
  ],
  rules: {
    'no-console': 'off'
  },
  overrides: [
    {
      files: ['*.test.js', '*.test.ts'],
      rules: {
        'no-unused-expressions': 'off',
        // chai assertions trigger this rule
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    },
    {
      // otherwise it will raise an error in every JavaScript file
      files: ['*.ts'],
      rules: {
        // this rule seems broken and results in false-positives
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        // ts-node we use to run tests fails on some 'ts-expect-error' directives
        '@typescript-eslint/prefer-ts-expect-error': ['warn'],
        // allow using '${val}' with numbers, bool and null types
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          {
            allowNumber: true,
            allowBoolean: true,
            allowNullable: true
          }
        ]
      }
    }
  ]
}