const config = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/npm', {
      'npmPublish': false
    }],
    ['@semantic-release/git', {
      'assets': ['samext.zip', 'samext-safari.app.zip', 'package.json', 'package-lock.json'],
      'message': 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    ['@semantic-release/github', {
      'assets': [
        { 'path': 'samext.zip', 'label': 'Chrome Extension (Minified)' },
        { 'path': 'samext-safari/samext-safari.app.zip', 'label': 'Safari Extension (macOS App)' }
      ]
    }]
  ]
};

module.exports = config;
