const config = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/git', {
      'assets': ['samext.zip', 'samext-safari.zip'],
      'message': 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    ['@semantic-release/github', {
      'assets': [
        { 'path': 'samext.zip', 'label': 'Chrome Extension (Minified)' },
        { 'path': 'samext-safari.zip', 'label': 'Safari Extension (macOS App)' }
      ]
    }]
  ]
};

module.exports = config;
