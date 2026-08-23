---
title: 5. 验证与故障排查
description: 构建、样式、Git Hooks 与模型测试边界。
docType: current-guide
sidebar:
  order: 5
verifiedAgainst: 4412509aa4c1f478c4e5920e65949f6aeb268181
verifiedAt: 2026-08-23
evidencePaths:
  - build.gradle
  - .githooks/pre-commit
  - .githooks/commit-msg
  - src/test/java/com/zxb/zxbaiagent/ZxbAiAgentApplicationTests.java
  - src/main/resources/application.yaml
verificationCommands:
  - ./gradlew styleCheck
  - ./gradlew build -x test
  - ./gradlew test
  - ./gradlew installGitHooks
---

## 无密钥检查

```bash
./gradlew spotlessCheck
./gradlew pmdMain
./gradlew styleCheck
./gradlew build -x test
```

`styleCheck` 组合 `spotlessCheck` 与 `pmdMain`。Spotless 使用 `config/eclipse-java-formatter.xml`；PMD 固定为 6.55.0 并启用 P3C naming、OOP、exception 和 flow-control 规则。`build -x test` 不执行测试，但测试源码编译或上下文初始化之外的问题仍需单独检查。

```bash
./gradlew installGitHooks
```

安装后，`pre-commit` 调用 `styleCheck`，`commit-msg` 调用 `verifyCommitMessage`。

## 交互式外部模型测试

`./gradlew test` 不是无密钥检查。`ZxbAiAgentApplicationTests.testChat()` 当前处于启用状态，会读取标准输入并调用真实模型；连接交互式 stdin 时可能等待。该测试没有断言，也不能视为自动化多轮记忆验证。CI 中应把无密钥检查与需要密钥、网络和人工输入的验证明确分开。

## 常见问题

- API key 占位符无法解析：检查变量是否为 `OPENAI_APIKEY`。
- 自定义地址未生效：检查变量是否为 `OPENAI_BASEURL`。
- 模型被拒绝：确认目标 OpenAI 兼容服务提供 `application.yaml` 中配置的模型标识。
- `test` 等待：停止任务，改运行无密钥检查；仅在受控人工环境执行 `testChat()`。
- 提交被拒绝：标题必须为带中文摘要的 `type(模块): 摘要`，检查点还必须满足[检查点维护](../../automation/checkpoints/)的 trailer 规则。
