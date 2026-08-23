---
title: 3. 运行对话
description: 主应用和测试源码中的命令行对话入口。
docType: current-guide
verifiedAgainst: 4412509aa4c1f478c4e5920e65949f6aeb268181
verifiedAt: 2026-08-23
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

主入口 `ZxbAiAgentApplication` 只启动 Spring Boot。当前没有面向用户的 Web 对话控制器。

## 命令行对话

```bash
./gradlew consoleChat
```

`consoleChat` 依赖 `testClasses`，并从测试源码集启动 `ConsoleChatApplication`。因此测试源码必须能编译；它不是生产源码中的发布入口。程序以非 Web 模式建立 Spring 上下文，每次启动生成一个 UUID，并让本次进程中的所有有效输入共用它。

输入 `exit` 或 `quit` 结束；空输入会被忽略；标准输入结束也会退出。对话会调用外部模型，所以运行前需要按[模型配置](../model-configuration/)提供密钥。
