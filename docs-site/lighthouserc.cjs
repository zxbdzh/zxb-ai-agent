module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4321/zxb-ai-agent/current/conversation-memory/'],
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4321',
      startServerReadyPattern: 'Local',
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['error', { maxNumericValue: 512000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-results/desktop' },
  },
};
