---
title: "自定义 Advisor 的对话输出"
description: "文档版本 docs-v1.0.19"
docType: evolution-record
checkpointSha: fc935d9b4bdc87addaacebc86798df77bbd06f5d
checkpointDate: "2026-09-12"
---

## 检查点主题

文档版本 docs\-v1\.0\.19

## 学习动机

通过推送文档 Tag，自动沉淀这一批代码的事实变化，避免手工维护 Wiki。

## 学习结果

已根据 `docs-v1.0.16` 到 `docs-v1.0.19` 的受限仓库语料生成 Wiki 更新候选，并经过固定 CI 验证。

## 运维影响

通过 \`LoveApp\` 发起的对话会额外向标准输出写入用户消息和模型回复；部署或运行时应将该输出视为可能包含对话内容。

## 变更说明

- \`LoveApp\` 的默认 Advisor 列表新增 \`MyCustomAdvisor\`，其前置和后置处理会将用户消息与模型回复输出到标准输出。
- 对话记忆窗口仍显式为 \`maxMessages\(3\)\`，并继续按 \`conversationId\` 隔离会话。

## 证据

- [`src/main/java/com/zxb/app/LoveApp.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/fc935d9b4bdc87addaacebc86798df77bbd06f5d/src/main/java/com/zxb/app/LoveApp.java)（repository）：\`LoveApp\` 将 \`MessageChatMemoryAdvisor\` 和新的 \`MyCustomAdvisor\` 一并注册为默认 Advisor，并保留三条消息窗口及会话 ID 参数。
- [`src/main/java/com/zxb/config/MyCustomAdvisor.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/fc935d9b4bdc87addaacebc86798df77bbd06f5d/src/main/java/com/zxb/config/MyCustomAdvisor.java)（repository）：\`MyCustomAdvisor\` 的 \`before\` 与 \`after\` 方法分别向标准输出打印用户消息和模型回复，且顺序值为 0。
- [`docs-site/src/content/docs/current/conversation-memory.md`](https://github.com/zxbdzh/zxb-ai-agent/blob/fc935d9b4bdc87addaacebc86798df77bbd06f5d/docs-site/src/content/docs/current/conversation-memory.md)（repository）：现有对话记忆指南已说明三条消息窗口、\`conversationId\` 隔离和进程内存边界；本次仅需补充新增 Advisor 的输出行为。

## 当前指南更新

- `conversation-memory#memory`
- `conversation-memory#lifecycle`

## 验证证据

- 已通过：`./gradlew styleCheck`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-fc935d9b4bdc87addaacebc86798df77bbd06f5d.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/34699647797)
- 已通过：`./gradlew build -x test`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-fc935d9b4bdc87addaacebc86798df77bbd06f5d.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/34699647797)

### 建议但未执行

- `docs-check`（建议但未执行）
- `docs-build`（建议但未执行）

## 事实修订说明

当前无修订。事实错误只能追加包含日期、作者、原因和新证据的说明；解释变化需要新的文档 Tag。
