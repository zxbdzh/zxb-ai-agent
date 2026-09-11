---
title: 4. 对话记忆与会话隔离
description: Conversation ID、消息窗口和进程内存边界。
docType: current-guide
sidebar:
  order: 4
verifiedAgainst: 83c358643aeac4e91edc19b2b3121327409222a1
verifiedAt: 2026-09-11
evidencePaths:
  - src/main/java/com/zxb/app/LoveApp.java
  - src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java
verificationCommands:
  - ./gradlew consoleChat
---

## 对话记忆

`LoveApp` 使用 `MessageWindowChatMemory`，并显式设置 `maxMessages(3)`。默认 Advisor 链包含 `MessageChatMemoryAdvisor` 和 `MyCustomAdvisor`：前者用于在请求中使用记忆，后者会在请求前向标准输出写入用户消息，并在响应后向标准输出写入模型回复文本。

每次 `doChat(message, chatId)` 调用都会将 `chatId` 作为 `ChatMemory.CONVERSATION_ID` 参数传入。相同 ID 对应同一会话记忆，不同 ID 用于区分会话。

## 生命周期

当前 `LoveApp` 在创建时构建 `MessageWindowChatMemory`，未配置 JDBC、Redis 或其他持久化记忆仓库。因此，记忆仅存在于该应用上下文中，重启进程或上下文后不应假定历史仍可用。

命令行入口每次启动生成新的随机 UUID。`LoveApp` 会以 INFO 级别记录模型回复；运行环境应考虑日志中可能出现的对话内容。
