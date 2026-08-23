import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: process.env.DOCS_SITE_URL ?? 'https://zxbdzh.github.io',
  base: process.env.DOCS_BASE_PATH ?? '/zxb-ai-agent',
  output: 'static',
  integrations: [
    starlight({
      title: 'zxb-ai-agent',
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        alt: 'zxb-ai-agent 运行轨迹',
      },
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/zxbdzh/zxb-ai-agent' },
      ],
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      sidebar: [
        { label: '当前指南', items: [{ autogenerate: { directory: 'current' } }] },
        { label: '演进记录', items: [{ autogenerate: { directory: 'evolution' } }] },
        { label: '参考资料', items: [{ autogenerate: { directory: 'reference' } }] },
        { label: '自动化维护', items: [{ autogenerate: { directory: 'automation' } }] },
      ],
    }),
  ],
});
