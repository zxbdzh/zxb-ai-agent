---
title: 4. 对话记忆与会话隔离
description: Conversation ID、20 条消息窗口和进程内存边界。
docType: current-guide
verifiedAgainst: f3176a90e0b514659a55e24112f31752df1ecd79
verifiedAt: 2026-08-23
evidencePaths:
  - src/main/java/com/zxb/app/LoveApp.java
  - src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java
verificationCommands:
  - ./gradlew consoleChat
---

## 对话记忆

`LoveApp` 使用 `MessageWindowChatMemory`，明确设置 `maxMessages(20)`，并通过 `MessageChatMemoryAdvisor` 注入历史消息。这里的 20 是消息条数，不应描述成 20 轮。

每次 `doChat(message, chatId)` 都把 `chatId` 作为 `ChatMemory.CONVERSATION_ID` 传入。相同会话 ID 共享对应历史；不同 ID 隔离会话。调用方必须稳定、明确地提供该 ID。

## 生命周期

当前没有 JDBC、Redis 或其他持久化记忆仓库配置。记忆保存在应用上下文内；进程或上下文重启后，不应假定旧历史仍存在。

命令行入口每次启动只生成一个随机 UUID，所以单次运行内可形成多轮上下文，重新启动后得到新会话。AI 回复还会以 INFO 日志记录，生产使用前应评估日志中的敏感内容。
