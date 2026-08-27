---
title: 5. 验证与故障排查
description: 构建、样式、Git Hooks 与模型测试边界。
docType: current-guide
sidebar:
  order: 5
verifiedAgainst: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
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

下列任务由构建脚本定义，可作为不执行测试任务的检查候选：

```bash
./gradlew spotlessCheck
./gradlew pmdMain
./gradlew styleCheck
./gradlew build -x test
```

`styleCheck` 依赖 `spotlessCheck` 和 `pmdMain`。Spotless 使用 `config/eclipse-java-formatter.xml`；PMD 固定为 6.55.0，并配置 P3C 的 naming、OOP、exception 和 flow-control 规则。`build -x test` 跳过测试任务执行。

构建脚本还提供 `installGitHooks`，用于将本地 `core.hooksPath` 指向 `.githooks`：

```bash
./gradlew installGitHooks
```

## 交互式外部模型测试

`ZxbAiAgentApplicationTests` 中的 `testChat()` 带有 `@Test`，其 `@Disabled` 注解处于注释状态。该测试会读取标准输入，生成随机 UUID，并调用 `LoveApp.doChat(...)`；因此会触发外部模型调用。测试方法没有断言，不能作为自动化对话记忆验证。

在需要执行该测试时，应准备 `OPENAI_APIKEY`，并预期其可能等待标准输入。

## 常见问题

- API 密钥占位符无法解析：检查运行环境是否提供 `OPENAI_APIKEY`。
- 自定义服务地址未生效：检查运行环境是否提供 `OPENAI_BASEURL`。
- 模型请求失败：核对服务是否接受 `application.yaml` 中的 `gpt-5.6-terra`。
- `test` 等待输入或触发外部调用：`testChat()` 会读取标准输入并调用 `LoveApp`；可改用不执行测试任务的检查。
- 命令行对话无法启动：`consoleChat` 使用测试源码集，并依赖 `testClasses`。
