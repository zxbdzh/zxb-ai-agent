---
title: 2. 模型配置
description: 当前 OpenAI 兼容模型的实际配置键和值。
docType: current-guide
sidebar:
  order: 2
verifiedAgainst: 54985619feb72d76c18f9c92eff6f4fc51790401
verifiedAt: 2026-08-28
evidencePaths:
  - src/main/resources/application.yaml
  - build.gradle
verificationCommands:
  - ./gradlew bootRun
---

## 当前配置

应用启用 Spring AI 的 OpenAI 模型 starter，并从 `application.yaml` 读取以下配置：

| 项目 | 当前值 |
|---|---|
| API 密钥变量 | `OPENAI_APIKEY` |
| 可选服务地址变量 | `OPENAI_BASEURL` |
| 默认服务地址 | `https://api.openai.com` |
| 模型 | `gpt-5.6-terra` |
| temperature | `0.7` |
| max-tokens | `1000` |

```powershell
$env:OPENAI_APIKEY = "<由密钥管理器提供>"
$env:OPENAI_BASEURL = "https://兼容服务地址"
./gradlew.bat bootRun
```

## 模型选择

`LoveApp` 构造函数接收通用的 `ChatModel` Bean。当前 Gradle 声明了 OpenAI 模型 starter；Ollama starter 依赖在构建文件中被注释。

使用兼容服务时，该服务需要支持 `application.yaml` 中的 `gpt-5.6-terra`；否则应将配置改为服务支持的模型标识。
