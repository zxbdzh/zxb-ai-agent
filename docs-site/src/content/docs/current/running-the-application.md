---
title: 3. 运行对话
description: 主应用和测试源码中的命令行对话入口。
docType: current-guide
sidebar:
  order: 3
verifiedAgainst: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
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

可建议用以下任务启动主应用：

```bash
./gradlew bootRun
```

`ZxbAiAgentApplication` 仅调用 `SpringApplication.run(...)` 启动 Spring Boot。所列源码中没有面向用户的 Web 对话控制器。

## 命令行对话

可建议用以下任务启动命令行对话：

```bash
./gradlew consoleChat
```

`consoleChat` 从测试源码集运行 `com.zxb.zxbaiagent.ConsoleChatApplication`，并依赖 `testClasses`。入口以非 Web 模式创建 Spring 上下文，每次启动生成一个 UUID，当前进程内的有效输入使用该 UUID 作为会话 ID。

输入 `exit` 或 `quit` 会结束程序；空输入会被忽略；标准输入结束时程序退出。每条有效输入都会调用模型，因此运行前需提供[模型配置](../model-configuration/)中的 API 密钥。
