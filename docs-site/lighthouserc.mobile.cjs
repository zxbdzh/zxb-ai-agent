module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4322/zxb-ai-agent/current/conversation-memory/'],
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4322',
      startServerReadyPattern: 'Local',
      numberOfRuns: 3,
      settings: {
        emulatedFormFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
      },
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
    upload: { target: 'filesystem', outputDir: './lighthouse-results/mobile' },
  },
};
