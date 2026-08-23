import { defineConfig, devices } from '@playwright/test';

const basePath = process.env.DOCS_BASE_PATH ?? '/zxb-ai-agent';
const port = Number(process.env.DOCS_PREVIEW_PORT ?? '4321');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}/`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}${basePath}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
