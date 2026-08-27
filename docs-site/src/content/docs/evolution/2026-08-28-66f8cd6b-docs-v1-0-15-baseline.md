---
title: "首个文档标签基线"
description: "文档版本 docs-v1.0.15"
docType: evolution-record
checkpointSha: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
checkpointDate: "2026-08-28"
---

## 检查点主题

文档版本 docs\-v1\.0\.15

## 学习动机

通过推送文档 Tag，自动沉淀这一批代码的事实变化，避免手工维护 Wiki。

## 学习结果

已根据 首次文档基线 `docs-v1.0.15` 的受限仓库语料生成 Wiki 更新候选，并经过固定 CI 验证。

## 运维影响

这是首个文档标签基线：运行应用需要 JDK 25 与可用的 OpenAI 兼容配置；命令行对话和启用的 testChat 都会调用外部模型，记忆仅保存在进程内并限制为最近 3 条消息。

## 变更说明

- 建立首个文档标签的中文基线，覆盖环境、模型、运行、记忆和验证事实。
- 当前对话记忆窗口实际保留最近 3 条消息，并按会话 ID 隔离。
- 模型配置使用 OpenAI 兼容 starter，读取 OPENAI\_APIKEY 与可选的 OPENAI\_BASEURL。
- 主应用仅启动 Spring Boot；命令行对话由测试源码集中的 consoleChat 任务提供。
- 无密钥检查可使用格式、PMD 和跳过测试的构建任务；testChat 是交互式外部模型测试。

## 证据

- [`build.gradle`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/build.gradle)（repository）：声明 Java Toolchain 25、Spring AI OpenAI 与聊天记忆 starter、styleCheck、consoleChat 及测试任务配置。
- [`src/main/resources/application.yaml`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/src/main/resources/application.yaml)（repository）：定义 OpenAI 兼容服务的 API 密钥、服务地址、模型和生成参数。
- [`src/main/java/com/zxb/ZxbAiAgentApplication.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/src/main/java/com/zxb/ZxbAiAgentApplication.java)（repository）：主应用仅以 SpringApplication 启动。
- [`src/main/java/com/zxb/app/LoveApp.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/src/main/java/com/zxb/app/LoveApp.java)（repository）：配置进程内 MessageWindowChatMemory 为最近 3 条消息，并以 CONVERSATION\_ID 调用模型。
- [`src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java)（repository）：命令行入口创建非 Web 上下文、每次启动生成 UUID，并处理 exit、quit、空输入和标准输入结束。
- [`src/test/java/com/zxb/zxbaiagent/ZxbAiAgentApplicationTests.java`](https://github.com/zxbdzh/zxb-ai-agent/blob/66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe/src/test/java/com/zxb/zxbaiagent/ZxbAiAgentApplicationTests.java)（repository）：包含启用的 contextLoads 与读取标准输入、调用真实对话的 testChat 测试。

## 当前指南更新

- `setup#prerequisites`
- `setup#local-secrets`
- `model-configuration#current-configuration`
- `model-configuration#model-selection`
- `running-the-application#main-application`
- `running-the-application#console-chat`
- `conversation-memory#memory`
- `conversation-memory#lifecycle`
- `verification-and-troubleshooting#secret-free-checks`
- `verification-and-troubleshooting#interactive-test`
- `verification-and-troubleshooting#common-problems`

## 验证证据

- 已通过：`./gradlew styleCheck`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/33125372335)
- 已通过：`./gradlew build -x test`；[版本化 evidence](https://github.com/zxbdzh/zxb-ai-agent/blob/master/docs-site/public/evidence/checkpoint-verification-66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe.json)；[GitHub Actions run](https://github.com/zxbdzh/zxb-ai-agent/actions/runs/33125372335)

### 建议但未执行

- `docs-check`（建议但未执行）
- `docs-build`（建议但未执行）

## 事实修订说明

当前无修订。事实错误只能追加包含日期、作者、原因和新证据的说明；解释变化需要新的文档 Tag。
