import { test, expect, type Page } from '@playwright/test';

/**
 * 章节感知型主题系统验收：
 * - data-chapter 按分区正确注入
 * - 动效等级（data-motion）默认 L1、可切换并持久化
 * - L0 经典模式与 prefers-reduced-motion 下动画全灭
 * - L3 沉浸模式下章节首页挂载 Canvas 效果
 */

type Chapter = 'home' | 'current' | 'evolution' | 'reference' | 'automation';

const PAGES: Array<{ path: string; chapter: Chapter; heading: RegExp }> = [
  { path: './', chapter: 'home', heading: /把 Agent 实验/ },
  { path: './current/setup/', chapter: 'current', heading: /环境与安装/ },
  { path: './evolution/', chapter: 'evolution', heading: /演进记录/ },
  { path: './reference/project-facts/', chapter: 'reference', heading: /项目事实/ },
  { path: './automation/validation/', chapter: 'automation', heading: /验证与发布维护/ },
];

async function setMotionLevel(page: Page, level: string): Promise<void> {
  await page.addInitScript((value) => localStorage.setItem('docs-motion-level', value), level);
}

test.describe('章节标识', () => {
  for (const { path, chapter, heading } of PAGES) {
    test(`${path} 注入 data-chapter="${chapter}"`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('data-chapter', chapter);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    });
  }

  test('主题色随章节切换（暗色 accent 色相）', async ({ page }) => {
    await page.goto('./current/setup/', { waitUntil: 'networkidle' });
    const hue = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--chapter-hue').trim(),
    );
    expect(hue).toBe('160');
  });

  test('跨章节导航：章节变量按上一章节插值过渡而非硬切', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('docs-chapter-prev', 'evolution'));
    await page.goto('./current/setup/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700); // 等插值完成（0.5s）
    const state = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        chapter: document.documentElement.dataset.chapter,
        hue: cs.getPropertyValue('--chapter-hue').trim(),
        transitionProps: cs.transitionProperty,
      };
    });
    expect(state.chapter).toBe('current');
    expect(state.hue).toBe('160');
    expect(state.transitionProps).toContain('--chapter-hue');
    // 记忆已滚动更新为当前章节
    const stored = await page.evaluate(() => localStorage.getItem('docs-chapter-prev'));
    expect(stored).toBe('current');
  });
});

test.describe('动效等级', () => {
  test('默认 L1：标题描边动画启用、氛围光漂移、Canvas 不挂载', async ({ page }) => {
    await page.goto('./evolution/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', '1');
    await expect(page.locator('#chapter-canvas')).toHaveCount(0);
    const underline = await page.evaluate(() =>
      getComputedStyle(document.querySelector('h1#_top')!, '::after').animationName,
    );
    expect(underline).toContain('chapter-underline');
    const ambient = await page.evaluate(() =>
      getComputedStyle(document.body, '::before').animationName,
    );
    expect(ambient).toBe('ambient-drift');
  });

  test('L0 经典模式：无动画、无氛围光、无 View Transition、无 Canvas', async ({ page }) => {
    await setMotionLevel(page, '0');
    await page.goto('./evolution/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', '0');
    await expect(page.locator('#chapter-canvas')).toHaveCount(0);
    const underline = await page.evaluate(() =>
      getComputedStyle(document.querySelector('h1#_top')!, '::after').animationName,
    );
    expect(underline).toBe('none');
    const ambient = await page.evaluate(
      () => getComputedStyle(document.body, '::before').content,
    );
    expect(ambient).toBe('none');
  });

  test('页头切换动效等级并持久化', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chromium',
      '移动端选择器位于折叠菜单内，可见性交互由桌面端覆盖',
    );
    await page.goto('./current/setup/', { waitUntil: 'networkidle' });
    const select = page.getByRole('banner').locator('starlight-motion-select select');
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('1');
    await select.selectOption('2');
    await expect(page.locator('html')).toHaveAttribute('data-motion', '2');
    const stored = await page.evaluate(() => localStorage.getItem('docs-motion-level'));
    expect(stored).toBe('2');
  });

  test('L3 沉浸模式：演进记录页挂载粒子效果', async ({ page }) => {
    await setMotionLevel(page, '3');
    await page.goto('./evolution/', { waitUntil: 'networkidle' });
    await expect(page.locator('#chapter-canvas')).toBeVisible();
  });

  test('L3 沉浸模式：参考资料页挂载数据流效果', async ({ page }) => {
    await setMotionLevel(page, '3');
    await page.goto('./reference/project-facts/', { waitUntil: 'networkidle' });
    await expect(page.locator('#chapter-canvas')).toBeVisible();
  });

  test('L3 沉浸模式：未配备效果的章节不挂载 Canvas', async ({ page }) => {
    await setMotionLevel(page, '3');
    await page.goto('./current/setup/', { waitUntil: 'networkidle' });
    await expect(page.locator('#chapter-canvas')).toHaveCount(0);
  });

  test('prefers-reduced-motion：标题动画与 Canvas 全灭', async ({ page }) => {
    await setMotionLevel(page, '3');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./evolution/', { waitUntil: 'networkidle' });
    await expect(page.locator('#chapter-canvas')).toHaveCount(0);
    const underline = await page.evaluate(() =>
      getComputedStyle(document.querySelector('h1#_top')!, '::after').animationName,
    );
    expect(underline).toBe('none');
  });
});
