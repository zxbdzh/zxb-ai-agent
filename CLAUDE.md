# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Spring Boot 4.1.0 + Spring AI 2.0.0 的 AI Agent 项目，集成 OpenAI 兼容 API，支持多轮对话上下文管理。

## 构建和测试命令

### 基本构建
```bash
./gradlew build              # 完整构建（包含测试）
./gradlew build -x test      # 构建但跳过测试
./gradlew clean build        # 清理后重新构建
```

### 测试
```bash
./gradlew test                                          # 运行所有测试
./gradlew test --tests MultiTurnConversationDemoTest   # 运行单个测试类
./gradlew test --tests ClassName.methodName            # 运行单个测试方法
```

### 代码质量检查
```bash
./gradlew styleCheck      # 检查 Java 格式和 Alibaba P3C 编码规约
./gradlew spotlessCheck   # 仅检查代码格式
./gradlew spotlessApply   # 自动修复代码格式
./gradlew pmdMain         # 运行 PMD 静态分析
```

### Git Hooks
```bash
./gradlew installGitHooks   # 安装 Git hooks（首次克隆后需执行）
```

## 架构和约定

### Spring AI 集成架构

项目使用 Spring AI 2.0.0 的 ChatClient API，核心组件：

1. **ChatClient**: 构建器模式创建，配置系统提示词和 Advisors
2. **MessageChatMemoryAdvisor**: 自动管理对话历史，注入到每次请求
3. **MessageWindowChatMemory**: 滑动窗口内存管理（默认保留 10 条消息）
4. **会话隔离**: 通过 `ChatMemory.CONVERSATION_ID` 参数区分不同对话

典型对话流程：
```
创建 ChatMemory → 配置 Advisor → 构建 ChatClient → 每次调用传入 conversationId
```

### 环境配置

**必需环境变量**：
- `OPENAI_API_KEY`: OpenAI 兼容的 API 密钥
- `OPENAI_BASE_URL`: 可选，API 端点（默认 OpenAI 官方地址）

**配置文件**: `src/main/resources/application.yaml`
- 使用 `${VAR:default}` 语法支持环境变量和默认值
- 模型参数（model、temperature、max-tokens）集中配置

### 代码规范

#### 格式化
- 使用 Eclipse Java Formatter，配置文件在 `config/eclipse-java-formatter.xml`
- 提交前自动运行 `spotlessCheck`，失败时运行 `spotlessApply` 修复

#### 静态分析
- Alibaba P3C 编码规约（PMD 6.55.0）
- 规则集：命名、OOP、异常处理、流程控制
- 提交前自动运行 `styleCheck`

#### Git 提交信息格式
```
type(模块): 中文摘要

type 可选值：feat, fix, refactor, docs, chore, test, build
模块名：小写字母、数字、点、下划线、斜杠
必须包含中文内容
```

示例：`feat(agent): 增加对话接口`

### 技术栈版本

- **Java**: 25
- **Spring Boot**: 4.1.0
- **Spring AI**: 2.0.0 (GA)
- **Spring Framework**: 7.0 (由 Spring Boot 4.1.0 传递)
- **构建工具**: Gradle 9.5.1

### 依赖管理

使用 Spring AI BOM 统一管理版本：
```gradle
implementation platform('org.springframework.ai:spring-ai-bom:2.0.0')
```

核心依赖：
- `spring-ai-starter-model-openai`: OpenAI 集成
- `spring-ai-starter-model-chat-memory`: 对话内存管理
- `hutool-all`: 工具库

### 项目结构

```
src/main/java/com/zxb/zxbaiagent/    # 主应用代码
src/test/java/com/zxb/zxbaiagent/    # 测试代码
src/main/resources/                   # 配置文件
config/                               # 代码格式化配置
.githooks/                            # Git hooks（pre-commit, commit-msg）
```

### 测试约定

- 测试类以 `Test` 结尾
- 使用 `@SpringBootTest` 进行集成测试
- Spring AI 测试需设置 `OPENAI_API_KEY` 环境变量
- 多轮对话测试验证 AI 能记住上下文（参考 `MultiTurnConversationDemoTest`）

## 开发工作流

1. **首次克隆**: `./gradlew installGitHooks`
2. **开发**: 编写代码，IDE 自动格式化或提交前自动修复
3. **提交前**: 自动运行 `styleCheck`（格式 + P3C 规约）和 `verifyCommitMessage`
4. **提交**: 使用规范的 commit message 格式
5. **构建**: `./gradlew build` 验证所有测试通过

## Spring AI 2.0 注意事项

- **会话 ID 必传**: 每次对话调用必须通过 `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))` 传入
- **系统提示词**: 在 `ChatClient.builder()` 时通过 `.defaultSystem()` 配置
- **内存限制**: `MessageWindowChatMemory` 的 `maxMessages` 控制保留消息数，避免内存溢出
- **生产环境**: 考虑使用持久化存储（Redis、JDBC）替代内存存储
