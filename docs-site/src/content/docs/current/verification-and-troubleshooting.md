---
title: 5. 验证与故障排查
description: 构建、样式、Git Hooks 与模型测试边界。
docType: current-guide
sidebar:
  order: 5
verifiedAgainst: 54985619feb72d76c18f9c92eff6f4fc51790401
verifiedAt: 2026-08-28
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

`styleCheck` 依赖 `spotlessCheck` 和 `pmdMain`。Spotless 对 Java 源码使用 `config/eclipse-java-formatter.xml`；PMD 固定为 6.55.0，并启用 P3C 的 naming、OOP、exception 与 flow-control 规则。

```bash
./gradlew installGitHooks
```

`installGitHooks` 将本地 Git 的 `core.hooksPath` 指向 `.githooks`。

## 交互式外部模型测试

`./gradlew test` 包含 `ZxbAiAgentApplicationTests.testChat()`。该测试当前未禁用，读取标准输入并调用 `LoveApp`，从而可能访问外部模型。它没有断言，且在连接交互式标准输入时可能等待输入。

将此类需要密钥、网络和人工输入的验证，与不调用外部模型的构建和样式检查分开执行。

## 常见问题

- API 密钥占位符无法解析：确认运行环境提供 `OPENAI_APIKEY`。
- 自定义服务地址未生效：确认运行环境提供 `OPENAI_BASEURL`。
- 模型请求失败：确认目标服务支持 `application.yaml` 中配置的模型标识。
- `test` 等待输入：`testChat()` 会读取标准输入；结束该任务后，改用不依赖外部模型的检查，或在具备密钥和人工输入的环境中运行。
- `consoleChat` 无法启动：该任务依赖 `testClasses`，先处理测试源码编译问题。
