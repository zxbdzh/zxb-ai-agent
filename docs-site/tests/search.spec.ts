import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

type Fixture = { query: string; destination: string; maxRank: number; kind: 'identifier' | 'topic' };
const fixtures = JSON.parse(await readFile(path.resolve('tests/fixtures/search.json'), 'utf8')) as Fixture[];

test('Chinese Pagefind UI returns every representative fixture within its rank budget', async ({ page }) => {
  await page.goto('./current/conversation-memory/', { waitUntil: 'networkidle' });
  const openSearch = page.getByRole('button', { name: /搜索/ }).first();
  await expect(openSearch).toBeVisible();

  for (const fixture of fixtures) {
    const dialog = page.getByRole('dialog');
    const beforeSearch = await page.evaluate(() => performance.getEntriesByType('resource').reduce((sum, entry) => {
      const resource = entry as PerformanceResourceTiming;
      return sum + (resource.transferSize || resource.encodedBodySize);
    }, 0));
    await openSearch.click();
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('searchbox').or(dialog.getByRole('textbox')).first();
    await expect(input).toBeVisible();
    await input.fill(fixture.query);
    const results = dialog.locator('a[href]');
    await expect.poll(async () => results.count(), { message: fixture.query }).toBeGreaterThan(0);
    if (fixture === fixtures[0]) {
      const afterSearch = await page.evaluate(() => performance.getEntriesByType('resource').reduce((sum, entry) => {
        const resource = entry as PerformanceResourceTiming;
        return sum + (resource.transferSize || resource.encodedBodySize);
      }, 0));
      expect(afterSearch - beforeSearch, 'additional first-search transfer').toBeLessThanOrEqual(500 * 1024);
    }
    const hrefs = await results.evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') ?? ''));
    const rank = hrefs.findIndex((href) => href.includes(fixture.destination)) + 1;
    expect(rank, `${fixture.query} (${fixture.kind})`).toBeGreaterThan(0);
    expect(rank, `${fixture.query} (${fixture.kind})`).toBeLessThanOrEqual(fixture.maxRank);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});
