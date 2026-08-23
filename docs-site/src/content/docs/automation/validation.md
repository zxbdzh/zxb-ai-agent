---
title: 验证与发布维护
description: 本地、CI、GitHub Pages 与搜索验收。
docType: automation
---

## 本地准备

使用 Node 22。在 Windows 验证阶段查询 `astro` 和 `@astrojs/starlight` 的 npm `latest` dist-tag，拒绝带预发布标识的版本，再用 `npm install --save-exact` 生成 `package-lock.json`。随后执行：

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm run build
npm run test:browser
npm run lighthouse
npm audit --omit=dev --audit-level=high
```

本地 preview 与测试都使用 `/zxb-ai-agent` base。Pagefind 只在 production build 后存在，因此搜索测试不能依赖开发服务器。

## 验证证据

检查点验证在没有模型秘密和写凭据的 job 中执行固定的 `styleCheck` 与 `build -x test`。成功后形成绑定完整 SHA、GitHub Actions run URL、固定命令和 artifact 名称的 JSON evidence。artifact 只在 job 之间临时传递；发布 job 会重新验证并把 sidecar 提交到 `docs-site/public/evidence/`，演进记录长期链接该版本化文件。生成器只能消费同 SHA 的严格 evidence；没有版本化 sidecar 不能作为持久的“已通过”证据。模型建议仍标为“建议但未执行”。

## 搜索样例

代表 fixture 覆盖中文主题、Java 标识符、环境变量、Gradle 任务和当前模型标识。标识符必须在前三名，中文主题必须在前五名，所有 fixture 都必须命中预期页面。

## GitHub 设置

Repository Settings 中把 Pages Source 设为 GitHub Actions。创建受保护的 `learning-checkpoint-generation` environment，限制可部署分支为 `master` 并配置 required reviewer；把 `OPENAI_API_KEY` 保存为该 environment 的 secret，可选配置仓库变量 `OPENAI_MODEL`。

Actions 默认 token 保持只读。请求、验证与生成 job 只有读权限且 checkout 使用 `persist-credentials: false`；只有独立发布 job 获得 `contents: write` 和 `pull-requests: write`，该 job 不接收模型秘密。Pages 部署 job 单独获得 `pages: write` 与 `id-token: write`。

定量门槛和证据记录格式见[量化验收](../../reference/acceptance/)。CI 必须在构建、Pagefind、base 路径、链接、指南新鲜度、axe 和 Lighthouse gate 全部通过后才上传 Pages artifact。
