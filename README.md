# zxb-ai-agent

Spring Boot 4 + Spring AI 2.0 的实验项目：围绕 ChatClient、对话记忆（ChatMemory）与 Advisor 机制做验证，同时把工程质量门禁（Spotless + Alibaba P3C）和「学习检查点」文档机制跑通。

[English](README.en.md)

## 当前内容

- **ChatClient 多轮对话**：`MessageChatMemoryAdvisor` + `MessageWindowChatMemory` 滑动窗口记忆，按 `conversationId` 隔离会话（示例：`LoveApp`）
- **OpenAI 兼容接入**：可对接任意 OpenAI 兼容端点，环境变量配置
- **质量门禁**：`./gradlew styleCheck` 一键跑 Spotless 格式检查 + Alibaba P3C 规约（PMD 6）
- **学习文档机制**：以 commit trailer 标记 Learning Checkpoint，自动产出 Evolution Record（见 [CONTEXT.md](./CONTEXT.md)）

## 快速开始

环境：JDK 25（Gradle wrapper 自带，无需本地 Gradle）。

```bash
# 必需：OpenAI 兼容 API Key
export OPENAI_APIKEY=***

# 可选：自定义端点（默认 OpenAI 官方地址）
export OPENAI_BASEURL=https://your-endpoint/v1

./gradlew bootRun
```

配置细节见 `src/main/resources/application.yaml`。

## 构建与测试

```bash
./gradlew build              # 完整构建（含测试）
./gradlew build -x test      # 跳过测试
./gradlew test               # 运行所有测试
./gradlew styleCheck         # 格式 + P3C 检查
./gradlew spotlessApply      # 自动修复格式
./gradlew installGitHooks    # 首次克隆后安装 Git hooks
```

## 路线图

- [ ] RAG（检索增强生成）
- [ ] MCP 集成
- [ ] Ollama 本地模型支持

## 许可证

[MIT](./LICENSE)
