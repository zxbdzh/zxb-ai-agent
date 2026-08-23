import { test, expect } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

for (const theme of ['dark', 'light'] as const) {
  test(`homepage ${theme} theme is framed and readable`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('starlight-theme', value), theme);
    await page.goto('./', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('把 Agent 实验');
    await expect(page.getByRole('link', { name: '进入当前指南' })).toBeVisible();
    await expect(page.locator('.hero img')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`homepage-${theme}.png`), fullPage: true });
  });

  test(`model guide ${theme} theme keeps navigation and content ordered`, async ({ page }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('starlight-theme', value), theme);
    await page.goto('./current/model-configuration/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: '2. 模型配置' })).toBeVisible();
    const guideLabels = await page.locator('#starlight__sidebar a[href*="/current/"]').allTextContents();
    expect(guideLabels.map((label) => label.trim())).toEqual([
      '1. 环境与安装',
      '2. 模型配置',
      '3. 运行对话',
      '4. 对话记忆与会话隔离',
      '5. 验证与故障排查',
    ]);
    await expect(page.locator('table')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`model-guide-${theme}.png`), fullPage: true });
  });
}
