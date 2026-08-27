---
title: 3. 运行对话
description: 主应用和测试源码中的命令行对话入口。
docType: current-guide
sidebar:
  order: 3
verifiedAgainst: 54985619feb72d76c18f9c92eff6f4fc51790401
verifiedAt: 2026-08-28
evidencePaths:
  - build.gradle
  - src/main/java/com/zxb/ZxbAiAgentApplication.java
  - src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java
verificationCommands:
  - ./gradlew bootRun
  - ./gradlew consoleChat
---

## 主应用

```bash
./gradlew bootRun
```

主入口 `ZxbAiAgentApplication` 调用 `SpringApplication.run(...)` 启动 Spring Boot 应用。仓库提供的主应用代码中未定义 Web 对话控制器。

## 命令行对话

```bash
./gradlew consoleChat
```

`consoleChat` 依赖 `testClasses`，使用测试源码集的运行时类路径启动 `ConsoleChatApplication`。该入口以非 Web 模式建立 Spring 上下文，并在每次启动时生成一个 UUID；同一进程内的有效输入共用该 UUID。

输入 `exit` 或 `quit` 会结束对话；空输入会被忽略；标准输入结束时程序退出。每条有效输入都会调用外部模型，因此运行前需要按[模型配置](../model-configuration/)提供 API 密钥。
