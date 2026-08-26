---
title: 自动化安全边界
description: 语料、提供方、引用与输出约束。
docType: automation
---

## 不可信数据

仓库文本、提交 trailer、模型返回和网页内容都只按数据处理。自动化不使用 `eval`、shell 字符串、子进程脚本、动态工作流或模型选择的命令。依赖只从已审查的默认分支精确 lockfile 以 `npm ci --ignore-scripts` 安装。

语料只来自请求 SHA 的 Git tracked text。生成目录、vendor、依赖、二进制、含 NUL、无效 UTF-8、大文件、凭据和秘密模式会在 API 调用前被排除或使流程关闭失败。固定 Git runner 使用 argv 数组、`shell: false` 和显式环境 allowlist，不向子进程传递 `OPENAI_API_KEY`、`GH_TOKEN` 或 `GITHUB_TOKEN`。

同一秘密检测器覆盖 trailer、外部摘要、模型 JSON、渲染 Markdown、指南 patch、manifest、PR 正文和上传 artifact。错误只报告路径与规则名，不显示匹配值。

## 提供方

Tag 驱动的日常流程只使用 `GenerationProvider`，不执行开放式 Web 搜索。生成器通过 `OPENAI_BASE_URL` 连接兼容服务的 `POST /v1/responses`；该 base 必须是无凭据、query 和 fragment 的 HTTPS URL。兼容服务必须支持 Responses API 和 strict JSON Schema。生成器只接收目标 Tag 的受保护仓库语料、两个文档 Tag 之间的有界 Git diff、Current Guide evidence 影响和固定 allowlist；输出在本地再次验证身份、中文内容、引用路径、目标区段、大小和秘密模式。模型只能引用目标 Tag 内实际存在的仓库文件。

历史 Learning Checkpoint 手动兼容流程仍保留分离的 `SearchProvider` 与 `GenerationProvider`。该路径最多两次查询、总来源最多八个，外部引用必须精确命中当前搜索结果和受控 HTTPS 规则。两种路径的 schema 修复都最多两次，并有输入大小和超时限制。

## 引用等级

- `repository`：目标 Tag 提交中的语料路径，是 Tag 自动更新唯一允许的引用，也是项目事实的首选证据。
- `official`：仅允许受控官方 HTTPS host，可支持外部 API 或工具事实。
- `secondary`：必须使用 HTTPS，仅作背景，不足以推翻仓库或官方证据。

每条外部事实必须有 URL 和标题，并且 URL 必须来自本次受限搜索结果；仓库引用必须是受保护语料内路径。没有证据的推断不得进入记录。

## 修订政策

已落地演进记录只能追加“事实修订说明”，其中必须有日期、作者、原因和新证据。模型不得改写原文。解释变化需要新的检查点。历史回填只接受人工提供的逐字动机和结果；[历史清单](../../reference/historical-checkpoints/)本身不提供这些内容。
