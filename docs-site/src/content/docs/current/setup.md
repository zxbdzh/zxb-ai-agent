---
title: 1. 环境与安装
description: Java、Gradle Wrapper 与首次构建前提。
docType: current-guide
sidebar:
  order: 1
verifiedAgainst: 54985619feb72d76c18f9c92eff6f4fc51790401
verifiedAt: 2026-08-28
evidencePaths:
  - build.gradle
  - gradle/wrapper/gradle-wrapper.properties
  - .gitignore
verificationCommands:
  - ./gradlew --version
  - ./gradlew build -x test
---

## 前提

项目在 `build.gradle` 中指定 Java Toolchain 25，并使用 Gradle Wrapper。构建依赖从 Maven Central 解析；运行构建需要满足这些环境条件。

```bash
./gradlew --version
./gradlew build -x test
```

Windows PowerShell 使用 `./gradlew.bat`。`build -x test` 会跳过测试任务，但 Gradle 的构建生命周期仍可能编译测试源码。

## 本地秘密

模型 API 密钥由环境变量 `OPENAI_APIKEY` 提供；可选的服务地址变量为 `OPENAI_BASEURL`。`application.yaml` 对服务地址设置了 `https://api.openai.com` 默认值，但 API 密钥没有默认值。

应通过进程环境或 IDE 运行配置提供这些变量，避免将凭据写入仓库文件。模型参数见[模型配置](../model-configuration/)。
