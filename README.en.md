# zxb-ai-agent

A Spring Boot 4 + Spring AI 2.0 playground: experimenting with ChatClient, chat memory (ChatMemory) and the Advisor mechanism, while keeping strict quality gates (Spotless + Alibaba P3C) and a learning-checkpoint documentation workflow.

[中文](README.md)

## What's inside

- **ChatClient multi-turn chat**: `MessageChatMemoryAdvisor` + `MessageWindowChatMemory` sliding-window memory, sessions isolated by `conversationId` (example: `LoveApp`)
- **OpenAI-compatible endpoint**: works with any OpenAI-compatible API, configured via environment variables
- **Quality gates**: `./gradlew styleCheck` runs Spotless formatting + Alibaba P3C rules (PMD 6)
- **Learning docs workflow**: commits tagged with Learning Checkpoint trailers produce Evolution Records automatically (see [CONTEXT.md](./CONTEXT.md))

## Quick start

Requirements: JDK 25 (Gradle wrapper included, no local Gradle needed).

```bash
# Required: an OpenAI-compatible API key
export OPENAI_APIKEY=***

# Optional: custom endpoint (defaults to the official OpenAI URL)
export OPENAI_BASEURL=https://your-endpoint/v1

./gradlew bootRun
```

See `src/main/resources/application.yaml` for details.

## Build & test

```bash
./gradlew build              # full build with tests
./gradlew build -x test      # build without tests
./gradlew test               # run all tests
./gradlew styleCheck         # formatting + P3C checks
./gradlew spotlessApply      # auto-fix formatting
./gradlew installGitHooks    # install Git hooks after first clone
```

## Roadmap

- [ ] RAG (retrieval-augmented generation)
- [ ] MCP integration
- [ ] Ollama local model support

## License

[MIT](./LICENSE)
