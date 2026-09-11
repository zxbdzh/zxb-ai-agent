<div align="center">

# zxb-ai-agent

[中文](README.md)

**A Spring Boot 4 + Spring AI 2.0 playground.** Experimenting with ChatClient, chat memory and the Advisor mechanism — while keeping strict quality gates and a learning-checkpoint documentation workflow.

<sub>// ChatClient multi-turn chat · Spotless + Alibaba P3C · Learning Checkpoint</sub>

<br />

![Java](https://img.shields.io/badge/Java-25-f89820?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-6db33f?logo=springboot&logoColor=white)
![Spring AI](https://img.shields.io/badge/Spring%20AI-2.0.0-6db33f?logo=spring&logoColor=white)
![Gradle](https://img.shields.io/badge/Gradle-9.x-02303a?logo=gradle&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## What's inside

- 💬 **ChatClient multi-turn chat** — `MessageChatMemoryAdvisor` + `MessageWindowChatMemory` sliding-window memory, sessions isolated by `conversationId` (example: `LoveApp`)
- 🔌 **OpenAI-compatible endpoint** — works with any OpenAI-compatible API, configured via environment variables
- 🛡 **Quality gates** — `./gradlew styleCheck` runs Spotless formatting + Alibaba P3C rules (PMD 6)
- 📚 **Learning docs workflow** — commits tagged with Learning Checkpoint trailers produce Evolution Records automatically (see [CONTEXT.md](./CONTEXT.md))

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
