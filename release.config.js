const config = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/git', {
      'assets': ['samext.zip'],
      'message': 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    ['@semantic-release/github', {
      'assets': [
        { 'path': 'samext.zip', 'label': 'Minified zip' }
      ]
    }]
  ]
};

module.exports = config;
