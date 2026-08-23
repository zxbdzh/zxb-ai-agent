import { test, expect } from '@playwright/test';

const basePath = process.env.DOCS_BASE_PATH ?? '/zxb-ai-agent';

test('all generated internal URLs, assets, fragments, canonicals, and requests stay valid under the project base', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const pending = [new URL(baseURL!).href];
  const visited = new Set<string>();
  const escapedRequests: string[] = [];
  page.on('request', (networkRequest) => {
    const url = new URL(networkRequest.url());
    if (url.origin === origin && !url.pathname.startsWith(`${basePath}/`)) escapedRequests.push(url.href);
  });

  while (pending.length > 0) {
    const current = pending.shift()!;
    const normalized = current.split('#')[0]!;
    if (visited.has(normalized)) continue;
    visited.add(normalized);
    const response = await page.goto(normalized, { waitUntil: 'networkidle' });
    expect(response?.status(), normalized).toBeLessThan(400);
    expect(new URL(page.url()).pathname, normalized).toMatch(new RegExp(`^${basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`));

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, `${normalized} canonical`).toBeTruthy();
    const canonicalUrl = new URL(canonical!);
    expect(canonicalUrl.origin).toBe('https://zxbdzh.github.io');
    expect(canonicalUrl.pathname).toMatch(new RegExp(`^${basePath}/`));

    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
    for (const href of links) {
      const url = new URL(href);
      if (url.origin !== origin) continue;
      expect(url.pathname, href).toMatch(new RegExp(`^${basePath}/`));
      const targetResponse = await request.get(url.href.split('#')[0]!);
      expect(targetResponse.status(), href).toBeLessThan(400);
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        await page.goto(href);
        expect(await page.locator('[id]').evaluateAll((nodes, expected) => nodes.some((node) => node.id === expected), id), `fragment ${href}`).toBe(true);
      }
      if ((targetResponse.headers()['content-type'] ?? '').includes('text/html') && !visited.has(url.href.split('#')[0]!)) pending.push(url.href);
    }

    const resources = await page.locator('img[src],script[src],link[href]').evaluateAll((nodes) => nodes.map((node) => (node as HTMLImageElement).src || (node as HTMLLinkElement).href).filter(Boolean));
    for (const href of resources) {
      const url = new URL(href);
      if (url.origin !== origin) continue;
      expect(url.pathname, href).toMatch(new RegExp(`^${basePath}/`));
      const assetResponse = await request.get(url.href);
      expect(assetResponse.status(), href).toBeLessThan(400);
    }
  }
  expect(escapedRequests).toEqual([]);
  expect(visited.size).toBeGreaterThanOrEqual(14);
});
