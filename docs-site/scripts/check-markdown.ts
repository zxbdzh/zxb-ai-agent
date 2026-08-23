import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = [path.join(siteRoot, 'src/content/docs'), path.join(siteRoot, 'templates')];
const errors: string[] = [];

async function markdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? markdownFiles(target) : entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
  }));
  return nested.flat();
}

function nodeText(node: { children?: unknown[]; value?: unknown }): string {
  if (typeof node.value === 'string') return node.value;
  return Array.isArray(node.children) ? node.children.map((child) => nodeText(child as { children?: unknown[]; value?: unknown })).join('') : '';
}

function report(file: string, message: string): void {
  errors.push(`${path.relative(siteRoot, file).replaceAll('\\', '/')}: ${message}`);
}

async function validateReference(file: string, url: string, image: boolean): Promise<void> {
  if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(url)) return;
  if (url.startsWith('/')) { report(file, `absolute local URL is forbidden: ${url}`); return; }
  const [pathname, fragment] = url.split('#', 2);
  if (!pathname) return;
  if (fragment) report(file, `cross-page heading fragments are forbidden: ${url}`);
  const decoded = decodeURIComponent(pathname);
  const docsRoot = path.resolve(siteRoot, 'src/content/docs');
  const routeBase = path.basename(file) === 'index.md' ? path.dirname(file) : file.slice(0, -'.md'.length);
  const routeTarget = path.resolve(routeBase, decoded);
  const relative = path.relative(docsRoot, routeTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { report(file, `path traversal outside documentation root: ${url}`); return; }

  const candidates = image
    ? [routeTarget]
    : decoded.endsWith('/')
      ? [`${routeTarget}.md`, path.join(routeTarget, 'index.md')]
      : [];
  if (!image && candidates.length === 0) {
    report(file, `source content links must use a trailing-slash site route: ${url}`);
    return;
  }
  const matches = await Promise.all(candidates.map(async (candidate) => {
    try {
      return (await stat(candidate)).isFile();
    } catch {
      return false;
    }
  }));
  if (!matches.some(Boolean)) report(file, `missing source for site route: ${url}`);
}

for (const root of roots) {
  for (const file of await markdownFiles(root)) {
    const source = await readFile(file, 'utf8');
    let tree;
    try {
      tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).use(remarkMdx).parse(source);
    } catch (error) {
      report(file, `Markdown parse failed: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const headings = new Set<string>();
    const referenceChecks: Promise<void>[] = [];

    const definitions = new Map<string, string>();
    visit(tree, 'definition', (node: { identifier: string; url: string }) => {
      definitions.set(node.identifier.toLocaleLowerCase('en-US'), node.url);
    });

    visit(tree, (node: { type: string; value?: string; url?: string; identifier?: string; children?: unknown[] }) => {
      if (node.type === 'html' || node.type.startsWith('mdx')) report(file, 'raw HTML, JSX, and MDX syntax are forbidden');
      if (node.type === 'heading') {
        const heading = nodeText(node).trim().toLocaleLowerCase('zh-CN');
        if (headings.has(heading)) report(file, `duplicate heading: ${heading}`);
        headings.add(heading);
        if (/\s*\{(?:#|\.)[^}]+\}\s*$/.test(heading)) report(file, `tool-specific heading attribute: ${heading}`);
      }
      if (node.type === 'paragraph') {
        const text = nodeText(node).trim();
        if (/^(?:import|export)\s/.test(text)) report(file, 'imports and exports are forbidden');
        if (/^:{2,3}[A-Za-z]/.test(text)) report(file, 'Astro/Starlight directives are forbidden');
      }
      if ((node.type === 'link' || node.type === 'image') && node.url) referenceChecks.push(validateReference(file, node.url, node.type === 'image'));
      if ((node.type === 'linkReference' || node.type === 'imageReference') && node.identifier) {
        const url = definitions.get(node.identifier.toLocaleLowerCase('en-US'));
        if (!url) report(file, `missing reference definition: ${node.identifier}`);
        else referenceChecks.push(validateReference(file, url, node.type === 'imageReference'));
      }
    });
    await Promise.all(referenceChecks);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Portable Markdown check passed.');
}
