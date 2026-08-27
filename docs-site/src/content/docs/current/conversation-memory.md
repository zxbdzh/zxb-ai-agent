---
title: 4. 对话记忆与会话隔离
description: Conversation ID、20 条消息窗口和进程内存边界。
docType: current-guide
sidebar:
  order: 4
verifiedAgainst: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
verifiedAt: 2026-08-28
evidencePaths:
  - src/main/java/com/zxb/app/LoveApp.java
  - src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java
verificationCommands:
  - ./gradlew consoleChat
---

## 对话记忆

`LoveApp` 创建进程内的 `MessageWindowChatMemory`，并设置 `maxMessages(3)`；该值表示最多保留 3 条消息。`MessageChatMemoryAdvisor` 被配置为默认 Advisor。

每次 `doChat(message, chatId)` 都将 `chatId` 作为 `ChatMemory.CONVERSATION_ID` 参数传入。同一会话 ID 对应同一记忆上下文；不同 ID 用于区分会话。

## 生命周期

当前代码使用进程内 `MessageWindowChatMemory`，未显示 JDBC、Redis 或其他持久化记忆仓库配置。因此不应假定应用进程或上下文重启后仍保留先前历史。

命令行入口每次启动生成新的随机 UUID，因此一次命令行运行内的有效输入共享会话 ID，重新启动时会使用新的会话 ID。`LoveApp` 会以 INFO 日志记录模型返回内容。
