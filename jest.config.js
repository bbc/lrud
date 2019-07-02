module.exports = {
  'roots': [
    '<rootDir>/src'
  ],
  'collectCoverageFrom': [
    'src/**/*.{js,jsx,ts}',
    '!<rootDir>/node_modules/',
    '!<rootDir>/path/to/dir/',
    '!<rootDir>/dist/'
  ],
  'transform': {
    '^.+\\.tsx?$': 'ts-jest'
  }
}
