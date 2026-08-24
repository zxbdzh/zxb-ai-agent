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

for (const viewport of [
  { name: 'zoomed-4k', width: 2095, height: 1133 },
  { name: 'native-4k', width: 3840, height: 2040 },
]) {
  test(`setup guide stays balanced at ${viewport.name} width`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem('starlight-theme', 'dark'));
    await page.goto('./current/setup/', { waitUntil: 'networkidle' });

    const geometry = await page.evaluate(() => {
      const mainPane = document.querySelector('.main-pane')?.getBoundingClientRect();
      const content = document.querySelector('main .content-panel:last-child .sl-container')?.getBoundingClientRect();
      const toc = document.querySelector('.right-sidebar-container')?.getBoundingClientRect();
      const search = document.querySelector('button[data-open-modal]')?.getBoundingClientRect();
      const localSecrets = [...document.querySelectorAll('.sl-markdown-content h2')].find(
        (heading) => heading.firstChild?.textContent?.trim() === '本地秘密',
      );
      const headingStyle = localSecrets ? getComputedStyle(localSecrets) : null;
      return {
        tocWidth: toc?.width ?? null,
        contentCenterDelta: mainPane && content
          ? content.left + content.width / 2 - (mainPane.left + mainPane.width / 2)
          : null,
        searchCenterDelta: search ? search.left + search.width / 2 - innerWidth / 2 : null,
        headingPaddingBlockStart: headingStyle ? Number.parseFloat(headingStyle.paddingBlockStart) : null,
      };
    });

    expect(geometry.tocWidth).toBeCloseTo(280, 0);
    expect(Math.abs(geometry.contentCenterDelta ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.searchCenterDelta ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(1);
    expect(geometry.headingPaddingBlockStart).toBeGreaterThanOrEqual(47);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: /搜索/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const dialogCenterDelta = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left + rect.width / 2 - innerWidth / 2;
    });
    expect(Math.abs(dialogCenterDelta)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`setup-${viewport.name}.png`), fullPage: true });
  });
}
