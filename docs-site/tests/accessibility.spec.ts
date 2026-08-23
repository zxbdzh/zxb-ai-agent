import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const route of ['./', './current/conversation-memory/', './current/verification-and-troubleshooting/']) {
  test(`no serious or critical axe violations on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
    expect(violations).toEqual([]);
  });
}
