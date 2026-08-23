---
title: 2. 模型配置
description: 当前 OpenAI 兼容模型的实际配置键和值。
docType: current-guide
sidebar:
  order: 2
verifiedAgainst: 4412509aa4c1f478c4e5920e65949f6aeb268181
verifiedAt: 2026-08-23
evidencePaths:
  - src/main/resources/application.yaml
  - build.gradle
verificationCommands:
  - ./gradlew bootRun
---

## 当前配置

应用启用 Spring AI OpenAI starter，并从 `application.yaml` 读取：

| 项目 | 当前值 |
|---|---|
| 必需 API 密钥变量 | `OPENAI_APIKEY` |
| 可选服务地址变量 | `OPENAI_BASEURL` |
| 默认服务地址 | `https://api.openai.com` |
| 模型 | `gpt-5.6-terra` |
| temperature | `0.7` |
| max-tokens | `1000` |

变量名没有 `KEY` 或 `URL` 前的下划线。`OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 不会满足当前 YAML 占位符。

```powershell
$env:OPENAI_APIKEY = "<由密钥管理器提供>"
$env:OPENAI_BASEURL = "https://兼容服务地址"
./gradlew.bat bootRun
```

## 模型选择

`LoveApp` 接收活动的通用 `ChatModel` Bean。构造参数名虽然是 `ollamaChatModel`，但当前 Gradle 启用的是 OpenAI starter，Ollama 依赖处于注释状态。兼容服务必须实际提供 `gpt-5.6-terra`，否则需要在 `application.yaml` 中改成服务支持的模型并重新验证本页。
