import { test, expect } from '@playwright/test';

const basePath = process.env.DOCS_BASE_PATH ?? '/zxb-ai-agent';

test('representative routes are served only under the GitHub project base', async ({ request }) => {
  const routes = [
    '',
    'current/setup/',
    'current/model-configuration/',
    'current/running-the-application/',
    'current/conversation-memory/',
    'current/verification-and-troubleshooting/',
    'evolution/',
    'reference/project-facts/',
    'reference/documentation-model/',
    'reference/acceptance/',
    'automation/checkpoints/',
  ];
  for (const route of routes) {
    const response = await request.get(`.${route ? `/${route}` : '/'}`);
    expect(response.status(), route).toBeLessThan(400);
  }
  const escaped = await request.get(new URL('/current/setup/', `http://127.0.0.1:${process.env.DOCS_PREVIEW_PORT ?? '4321'}`).href);
  expect(escaped.status()).toBeGreaterThanOrEqual(400);
  expect(basePath).toBe('/zxb-ai-agent');
});

test('representative guide stays within initial transfer budgets', async ({ page }) => {
  await page.goto('./current/conversation-memory/', { waitUntil: 'networkidle' });
  const sizes = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => {
    const resource = entry as PerformanceResourceTiming;
    return { name: resource.name, transfer: resource.transferSize || resource.encodedBodySize };
  }));
  const total = sizes.reduce((sum, item) => sum + item.transfer, 0);
  const javascript = sizes.filter((item) => new URL(item.name).pathname.endsWith('.js')).reduce((sum, item) => sum + item.transfer, 0);
  expect(total).toBeLessThanOrEqual(500 * 1024);
  expect(javascript).toBeLessThanOrEqual(150 * 1024);
});
