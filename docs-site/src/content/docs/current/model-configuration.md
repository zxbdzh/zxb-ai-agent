---
title: 2. 模型配置
description: 当前 OpenAI 兼容模型的实际配置键和值。
docType: current-guide
sidebar:
  order: 2
verifiedAgainst: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
verifiedAt: 2026-08-28
evidencePaths:
  - src/main/resources/application.yaml
  - build.gradle
verificationCommands:
  - ./gradlew bootRun
---

## 当前配置

应用声明 Spring AI OpenAI starter，并从 `src/main/resources/application.yaml` 读取以下配置：

| 项目 | 当前值 |
|---|---|
| API 密钥变量 | `OPENAI_APIKEY` |
| 可选服务地址变量 | `OPENAI_BASEURL` |
| 默认服务地址 | `https://api.openai.com` |
| 模型 | `gpt-5.6-terra` |
| `temperature` | `0.7` |
| `max-tokens` | `1000` |

配置中的占位符名称为 `OPENAI_APIKEY` 和 `OPENAI_BASEURL`。

## 模型选择

`LoveApp` 构造函数接收通用的 `ChatModel`。当前 Gradle 依赖启用 `spring-ai-starter-model-openai`；Ollama starter 仅以注释形式出现在构建文件中。

聊天模型标识由 `application.yaml` 中的 `spring.ai.openai.chat.model` 设置为 `gpt-5.6-terra`。使用兼容服务时，该服务需要接受此模型标识，或需相应调整配置。
