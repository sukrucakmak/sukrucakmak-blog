---
title: "Getting Started with Spring AI: ChatClient, Prompts, Structured Output and Chat Memory"
description: "Adding LLM support to a Spring Boot app with Spring AI — setup, the ChatClient API, prompt templates, structured output into records, streaming and conversation memory."
date: 2026-11-23
tags: [java, spring, spring-ai, ai, guide]
translation: /blog/spring-ai-getting-started
---

## Introduction

Spring AI is the official project for connecting large language models (LLMs) to Spring applications "the Spring way". The idea is familiar: just as JDBC abstracts the database and Spring Data abstracts the repository layer, Spring AI abstracts the model provider. Switching between OpenAI, Anthropic, Ollama, Azure OpenAI, Bedrock or Vertex AI is usually a matter of one starter and a few properties.

The core abstractions:

| Abstraction | What it does |
| --- | --- |
| `ChatModel` | Low-level access to a chat model |
| `ChatClient` | Fluent API on top of `ChatModel` — the one to use day to day |
| `EmbeddingModel` | Turns text into vectors (search, RAG) |
| `VectorStore` | Common interface for vector databases like PgVector, Redis, Elasticsearch |
| Advisor | Middleware around the request/response: memory, RAG, logging |

In this post we add chat, structured output, streaming and conversation memory to a Spring Boot app from scratch.

## 1. Setup

Spring AI manages dependency versions with a BOM. Pick the Spring AI line that matches your Spring Boot version: **1.x** for Boot 3.4/3.5, **2.x** for Boot 4.

```xml
<properties>
    <java.version>25</java.version>
    <spring-ai.version><!-- Spring AI version matching your Boot version --></spring-ai.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>${spring-ai.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-openai</artifactId>
    </dependency>
</dependencies>
```

Starter per provider:

| Provider | Starter |
| --- | --- |
| OpenAI | `spring-ai-starter-model-openai` |
| Anthropic (Claude) | `spring-ai-starter-model-anthropic` |
| Ollama (local) | `spring-ai-starter-model-ollama` |

## 2. Configuration

Never put the API key in code or in the repository; read it from an environment variable:

```properties
# OpenAI
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.options.model=gpt-4o-mini
spring.ai.openai.chat.options.temperature=0.3
```

```properties
# Anthropic
spring.ai.anthropic.api-key=${ANTHROPIC_API_KEY}
spring.ai.anthropic.chat.options.model=claude-sonnet-4-5
spring.ai.anthropic.chat.options.max-tokens=1024
```

The model names here are only examples; pick a suitable one from your provider's current model list. Lower `temperature` gives more consistent answers, higher values more creative ones.

## 3. First request with ChatClient

Spring Boot auto-configures a `ChatClient.Builder` bean for the model you picked. We inject it and build a `ChatClient` with application-specific defaults:

```java
@Configuration
class AiConfig {

    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("You are a senior Java developer. Answer briefly and clearly.")
                .build();
    }
}
```

```java
String answer = chatClient.prompt()
        .user("What is the difference between a record and a class in Java?")
        .call()
        .content();
```

`prompt()` → build the messages, `call()` → call the model synchronously, `content()` → get the response text. If you need metadata such as token usage, use `chatResponse()` instead of `content()`.

## 4. Prompt templates

Instead of concatenating user input into the prompt, use a parameterized template:

```java
String summary = chatClient.prompt()
        .user(u -> u.text("Explain {topic} in 3 bullet points to a {level} developer.")
                    .param("topic", "virtual threads")
                    .param("level", "junior"))
        .call()
        .content();
```

You can also keep long prompts as files under `src/main/resources/prompts/`, load them with `@Value("classpath:prompts/review.st") Resource` and pass them with `.text(resource)`. That way prompts go through code review and are versioned.

## 5. Structured output: mapping the answer to a record

To get a typed object instead of free text, use `entity()`. Spring AI derives a JSON schema from the target type, adds it to the prompt and converts the response:

```java
record BookRecommendation(String title, String author, int year, String reason) { }

BookRecommendation book = chatClient.prompt()
        .user("Recommend a single book for someone who wants to learn Java concurrency.")
        .call()
        .entity(BookRecommendation.class);
```

For generic types (e.g. lists) use `ParameterizedTypeReference`:

```java
List<BookRecommendation> books = chatClient.prompt()
        .user("Recommend 3 books for learning Spring.")
        .call()
        .entity(new ParameterizedTypeReference<List<BookRecommendation>>() { });
```

The model's output won't always match the schema; validating the returned object with Bean Validation and catching conversion errors is a good habit.

## 6. Streaming

For long answers, show tokens as they arrive instead of making the user wait for the whole response, with `stream()`:

```java
@GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<String> stream(@RequestParam String message) {
    return chatClient.prompt()
            .user(message)
            .stream()
            .content();
}
```

`stream()` returns Project Reactor's `Flux`. Spring MVC can also write a `Flux` return type as Server-Sent Events (SSE); if you want a fully reactive application, use `spring-boot-starter-webflux`.

## 7. Chat memory

LLMs are stateless: each request knows nothing about earlier messages. To carry the conversation history, use a `ChatMemory` and the `MessageChatMemoryAdvisor` that adds it to the prompt:

```java
@Bean
ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder()
            .maxMessages(20)          // keep the last 20 messages
            .build();
}

@Bean
ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory) {
    return builder
            .defaultSystem("You are a helpful assistant.")
            .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
            .build();
}
```

Each user/conversation gets its own id:

```java
chatClient.prompt()
        .user(message)
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
        .call()
        .content();
```

The default storage is in memory; the history is lost when the app restarts. For persistent memory, add one of Spring AI's JDBC (or other) chat memory repository starters and give the corresponding repository to `MessageWindowChatMemory`. Limiting the window size keeps both cost and context overflow under control.

## 8. End-to-end example: a REST controller

```java
record ChatRequest(String conversationId, String message) { }
record ChatResponse(String conversationId, String answer) { }
record CodeReview(int score, List<String> issues, String summary) { }

@RestController
@RequestMapping("/api/ai")
class AiController {

    private final ChatClient chatClient;

    AiController(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @PostMapping("/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        var id = request.conversationId() != null
                ? request.conversationId()
                : UUID.randomUUID().toString();

        var answer = chatClient.prompt()
                .user(request.message())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))
                .call()
                .content();

        return new ChatResponse(id, answer);
    }

    @PostMapping("/review")
    CodeReview review(@RequestBody String code) {
        return chatClient.prompt()
                .system("Review the code for security and readability. Score from 1 to 10.")
                .user(u -> u.text("Code to review:\n{code}").param("code", code))
                .call()
                .entity(CodeReview.class);
    }
}
```

```bash
curl -s localhost:8080/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hi, my name is Şükrü."}'
```

## 9. Debugging: SimpleLoggerAdvisor

To see the prompt sent to the model and the response that comes back:

```java
builder.defaultAdvisors(new SimpleLoggerAdvisor());
```

```properties
logging.level.org.springframework.ai.chat.client.advisor=DEBUG
```

Keep in mind that in production these logs may contain personal data.

## 10. Running locally with Ollama

To experiment without an API key or cost, use Ollama:

```bash
ollama pull llama3.2
ollama serve
```

```properties
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.options.model=llama3.2
```

Swap the starter for `spring-ai-starter-model-ollama`; the code that uses `ChatClient` stays the same.

## 11. Testing

- Don't call a real LLM in unit tests: it's slow, costs money and isn't deterministic.
- Put AI calls behind your own service class and mock that service in tests.
- To measure prompt quality, use separate, opt-in integration tests (e.g. against a local Ollama) and a fixed sample data set.

## Conclusion

Spring AI reduces LLM integration to concepts a Spring developer already knows: starters, properties, beans and advisors. With `ChatClient` you get chat in a few lines, typed answers with `entity()`, streaming with `stream()` and memory with `MessageChatMemoryAdvisor`. The next step is exposing your application's data and functions to the model: tool calling and MCP.
