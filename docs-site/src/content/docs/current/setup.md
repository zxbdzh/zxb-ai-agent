---
title: 1. 环境与安装
description: Java、Gradle Wrapper 与首次构建前提。
docType: current-guide
sidebar:
  order: 1
verifiedAgainst: 66f8cd6b3e123a9a1de3ecb77711d1c0ccdbdfbe
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

项目使用 Java Toolchain 25。构建脚本配置了 Maven Central，并使用仓库中的 Gradle Wrapper；在可使用 JDK 25 且可访问 Maven Central 的环境中，可建议执行：

```bash
./gradlew --version
./gradlew build -x test
```

Windows 可使用 `./gradlew.bat`。`build -x test` 会跳过测试任务执行；构建脚本中的 `consoleChat` 仍依赖 `testClasses`。

## 本地秘密

`application.yaml` 要求通过 `OPENAI_APIKEY` 提供 API 密钥，并支持以 `OPENAI_BASEURL` 覆盖服务地址；默认服务地址是 `https://api.openai.com`。配置文件未显示凭据值。

应通过进程环境或运行配置提供这些变量，避免将密钥写入仓库。模型变量详见[模型配置](../model-configuration/)。
