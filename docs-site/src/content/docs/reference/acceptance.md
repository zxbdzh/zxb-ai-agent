---
title: 量化验收
description: 文档站必须满足的门槛与待记录的试点基线。
docType: reference
---

## 强制门槛

| 指标 | 门槛 | 已观测值 | 测量日期 | 提交 SHA | 环境 | 命令 | CI artifact URL |
|---|---:|---|---|---|---|---|---|
| Current Guide 路由 | 恰好 5 | 待 Windows CI 测量 | 待记录 | 待记录 | Node 22 | `npm run check:current` | 待记录 |
| 过期或不完整指南 | 0 | 待测量 | 待记录 | 待记录 | full Git checkout | `npm run check:current` | 待记录 |
| 断链、资源或 fragment | 0 | 待测量 | 待记录 | 待记录 | Chromium production preview | `npm run test:links` | 待记录 |
| 可移植 Markdown 违规 | 0 | 待测量 | 待记录 | 待记录 | Node 22 | `npm run check:markdown` | 待记录 |
| 搜索 fixture 通过率 | 100% | 待测量 | 待记录 | 待记录 | Chromium + Pagefind | `npm run test:search` | 待记录 |
| 标识符查询排名 | 前 3 | 待测量 | 待记录 | 待记录 | Chromium + Pagefind | `npm run test:search` | 待记录 |
| 中文主题查询排名 | 前 5 | 待测量 | 待记录 | 待记录 | Chromium + Pagefind | `npm run test:search` | 待记录 |
| `/zxb-ai-agent/` 路由成功率 | 100% | 待测量 | 待记录 | 待记录 | production preview | `npm run test:static` | 待记录 |
| axe serious/critical | 0 | 待测量 | 待记录 | 待记录 | desktop/mobile Chromium | `npm run test:axe` | 待记录 |
| Lighthouse accessibility | `>= 95` | 待测量 | 待记录 | 待记录 | Lighthouse desktop/mobile | `npm run lighthouse` | 待记录 |
| Lighthouse performance | `>= 90` | 待测量 | 待记录 | 待记录 | Lighthouse desktop/mobile | `npm run lighthouse` | 待记录 |
| Mobile LCP | `<= 2.5 s` | 待测量 | 待记录 | 待记录 | Lighthouse mobile | `npm run lighthouse` | 待记录 |
| CLS | `<= 0.1` | 待测量 | 待记录 | 待记录 | Lighthouse | `npm run lighthouse` | 待记录 |
| 初始压缩传输 | `<= 500 KB` | 待测量 | 待记录 | 待记录 | representative guide | `npm run test:static` | 待记录 |
| 初始压缩 JavaScript | `<= 150 KB` | 待测量 | 待记录 | 待记录 | representative guide | `npm run test:static` | 待记录 |
| 首次搜索新增传输 | `<= 500 KB` | 待测量 | 待记录 | 待记录 | representative query | `npm run test:search` | 待记录 |
| 生产依赖 high/critical advisories | 0 | 待测量 | 待记录 | 待记录 | npm registry | `npm audit --omit=dev --audit-level=high` | 待记录 |

所有“待测量”都不是通过声明。Windows 验证或 CI 必须用真实完整 SHA、日期、环境、命令与 artifact URL 替换后，才能形成首个接受基线。

## 试点基线

| 指标 | 首次接受基线 | 测量日期 | 提交 SHA | 环境 | 命令 | CI artifact URL |
|---|---|---|---|---|---|---|
| 构建时长 | 待测量 | 待记录 | 待记录 | Node 22 Windows 与 CI Linux | `npm run build` | 待记录 |
| 安装依赖数量 | 待测量 | 待记录 | 待记录 | `npm ci` 后 | `npm ls --all --json` | 待记录 |
| 安装依赖磁盘大小 | 待测量 | 待记录 | 待记录 | `docs-site/node_modules` | Windows/CI 文件系统测量 | 待记录 |
| 生成输出大小 | 待测量 | 待记录 | 待记录 | `docs-site/dist` | Windows/CI 文件系统测量 | 待记录 |
| Pagefind 索引大小 | 待测量 | 待记录 | 待记录 | `docs-site/dist/pagefind` | Windows/CI 文件系统测量 | 待记录 |
| 桌面结果 | 待测量 | 待记录 | 待记录 | Desktop Chromium/Lighthouse | `npm run test:browser` 与 `npm run lighthouse:desktop` | 待记录 |
| 移动结果 | 待测量 | 待记录 | 待记录 | Pixel 7/Lighthouse mobile | `npm run test:browser` 与 `npm run lighthouse:mobile` | 待记录 |

这些指标先记录，不在首轮任意设门槛；首个接受基线审查后再决定后续 gate。

代表搜索必须覆盖中文 `对话记忆`、Java 标识符 `MessageWindowChatMemory` 和混合查询，并包含[搜索 fixture](../../automation/validation/)列出的所有词。
