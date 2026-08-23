---
title: 1. 环境与安装
description: Java、Gradle Wrapper 与首次构建前提。
docType: current-guide
sidebar:
  order: 1
verifiedAgainst: 4412509aa4c1f478c4e5920e65949f6aeb268181
verifiedAt: 2026-08-23
evidencePaths:
  - build.gradle
  - gradle/wrapper/gradle-wrapper.properties
  - .gitignore
verificationCommands:
  - ./gradlew --version
  - ./gradlew build -x test
---

## 前提

项目使用 Java Toolchain 25 和 Gradle Wrapper 9.5.1。无需全局安装 Gradle；需要可供 Toolchain 使用的 JDK 25、可访问 Maven Central 的网络，以及仓库中的 Wrapper 文件。

```bash
./gradlew --version
./gradlew build -x test
```

Windows PowerShell 使用 `./gradlew.bat`。`build -x test` 仍会编译测试源码，但跳过测试执行，适合先确认依赖与 Java 环境。

## 本地秘密

仓库忽略 `.env`、`.env.*`、`*.key`、`*.pem` 和 `credentials.json`。当前依赖没有显示自动加载 `.env` 的组件，应通过进程环境或 IDE 运行配置注入变量，且不得提交凭据。

模型变量见[模型配置](../model-configuration/)。
