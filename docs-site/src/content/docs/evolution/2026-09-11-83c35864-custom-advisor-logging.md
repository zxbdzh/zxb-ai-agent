---
title: "新增自定义 Advisor 的对话输出说明"
description: "文档版本 docs-v1.0.18"
docType: evolution-record
checkpointSha: 83c358643aeac4e91edc19b2b3121327409222a1
checkpointDate: "2026-09-11"
---

## 检查点主题

文档版本 docs\-v1\.0\.18

## 学习动机

通过推送文档 Tag，自动沉淀这一批代码的事实变化，避免手工维护 Wiki。

## 学习结果

已根据 `docs-v1.0.16` 到 `docs-v1.0.18` 的受限仓库语料生成 Wiki 更新候选，并经过固定 CI 验证。

## 运维影响

调用 \`LoveApp\` 进行对话时，标准输出会增加请求前的用户消息和响应后的模型回复文本；运行环境应据此考虑对话内容的输出范围。

## 变更说明

- \`LoveApp\` 的默认 Advisor 链新增 \`MyCustomAdvisor\`；该 Advisor 会在请求前输出用户消息，并在响应后输出模型回复文本。
- 对话记忆仍使用 \`MessageWindowChatMemory\` 的 \`maxMessages\(3\)\`，会话仍通过 \`ChatMemory\.CONVERSATION\_ID\` 隔离。

## 证据

- [`src/main/java/com/zxb/app/LoveApp.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/83c358643aeac4e91edc19b2b3121327409222a1/src/main/java/com/zxb/app/LoveApp.java)（repository）：\`LoveApp\` 在默认 Advisor 中同时注册记忆 Advisor 和 \`MyCustomAdvisor\`，并继续设置三条消息窗口及会话 ID 参数。
- [`src/main/java/com/zxb/config/MyCustomAdvisor.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/83c358643aeac4e91edc19b2b3121327409222a1/src/main/java/com/zxb/config/MyCustomAdvisor.java)（repository）：\`MyCustomAdvisor\` 的前置与后置方法分别向标准输出写入用户消息和响应文本，顺序值为 0。

## 当前指南更新

- `conversation-memory#memory`

## 验证证据

- 已通过：`./gradlew styleCheck`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-83c358643aeac4e91edc19b2b3121327409222a1.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/34611587423)
- 已通过：`./gradlew build -x test`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-83c358643aeac4e91edc19b2b3121327409222a1.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/34611587423)

### 建议但未执行

- `docs-check`（建议但未执行）
- `docs-build`（建议但未执行）

## 事实修订说明

当前无修订。事实错误只能追加包含日期、作者、原因和新证据的说明；解释变化需要新的文档 Tag。
