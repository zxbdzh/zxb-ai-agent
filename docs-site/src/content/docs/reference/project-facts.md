---
title: 项目事实
description: 可从仓库机械核验的版本、路径、命令和配置键。
docType: reference
---

| 类别 | 当前事实 |
|---|---|
| Java Toolchain | 25 |
| Gradle Wrapper | 9.5.1 |
| Spring Boot 插件 | 4.1.0 |
| Spring AI BOM | 2.0.0 |
| PMD | 6.55.0 |
| 主入口 | `src/main/java/com/zxb/ZxbAiAgentApplication.java` |
| 对话组件 | `src/main/java/com/zxb/app/LoveApp.java` |
| 控制台入口 | `src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java` |
| 模型配置 | `src/main/resources/application.yaml` |
| 必需变量 | `OPENAI_APIKEY` |
| 可选变量 | `OPENAI_BASEURL` |
| 模型 | 见 `src/main/resources/application.yaml` 的 `spring.ai.openai.chat.model` |
| 记忆窗口 | 20 条消息 |

常用无密钥命令：

```bash
./gradlew spotlessCheck
./gradlew pmdMain
./gradlew styleCheck
./gradlew build -x test
```

模型或交互命令：

```bash
./gradlew bootRun
./gradlew consoleChat
./gradlew test
```

最后一组可能需要真实密钥、网络或标准输入，不能与无密钥验证混为一谈。
