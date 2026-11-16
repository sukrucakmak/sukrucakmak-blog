---
title: "RAG with Spring AI and PostgreSQL pgvector"
description: "An app that answers questions over your own documents: generating embeddings with Spring AI, storing them in pgvector, similarity search, and enriching the prompt with QuestionAnswerAdvisor."
date: 2026-11-25
tags: [java, spring, spring-ai, ai, postgresql, guide]
translation: /blog/spring-ai-rag-pgvector
---

## Introduction

Large language models (LLMs) have general knowledge, but they don't know your internal documents, your product manual or the runbook written last week. Instead of retraining the model, the common approach is **RAG (Retrieval Augmented Generation)**: find the document chunks relevant to the question, add them to the prompt, and ask the model to answer based only on that context.

In this post we'll build an end-to-end RAG flow with Spring AI and store the vectors not in a separate vector database but in the PostgreSQL we already use, with the **pgvector** extension.

## 1. How does RAG work?

The flow has two phases:

**Ingestion (ETL):**

1. Read the documents (PDF, Markdown, HTML, DOCX...).
2. Split them into small chunks.
3. Generate an **embedding** (a numeric vector representing meaning) for each chunk.
4. Write the chunk, its metadata and its vector to the database.

**Querying:**

1. Generate an embedding for the user's question.
2. Find the most similar chunks in the vector database (retrieve).
3. Add these chunks to the prompt as context (augment).
4. Ask the model to produce an answer (generate).

Spring AI provides an abstraction for each step: `DocumentReader`, `TextSplitter`, `EmbeddingModel`, `VectorStore` and `ChatClient` advisors.

## 2. Running pgvector with Docker

```yaml
# compose.yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_DB: rag
      POSTGRES_USER: rag
      POSTGRES_PASSWORD: rag
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
psql -h localhost -U rag -d rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Spring AI can create the schema itself (see below), but checking that the extension is installed with `\dx` is a good habit. For psql commands, see the PostgreSQL psql commands post.

## 3. Dependencies

Let the Spring AI BOM manage the versions:

```xml
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
  <!-- Chat + embedding model -->
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
  </dependency>
  <!-- pgvector VectorStore -->
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-pgvector</artifactId>
  </dependency>
  <!-- QuestionAnswerAdvisor -->
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-advisors-vector-store</artifactId>
  </dependency>
  <!-- For reading PDF, DOCX, HTML -->
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-tika-document-reader</artifactId>
  </dependency>
</dependencies>
```

If you want to run locally, you can use `spring-ai-starter-model-ollama` instead of OpenAI. One important note: **Anthropic (Claude) does not offer an embedding model.** If you use Claude for chat, you need to pair it with OpenAI, Ollama or another provider for embeddings.

## 4. Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rag
    username: rag
    password: rag
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      embedding:
        options:
          model: text-embedding-3-small
    vectorstore:
      pgvector:
        initialize-schema: true
        index-type: HNSW
        distance-type: COSINE_DISTANCE
        dimensions: 1536
```

The `dimensions` value must **exactly match** the vector size produced by the embedding model (1536 for `text-embedding-3-small`). If you change the model, you need to recreate the table and all embeddings. In production, creating the table with a Flyway/Liquibase migration instead of `initialize-schema: true` gives you more control.

## 5. Loading documents (ETL)

```java
@Service
public class IngestionService {

    private final VectorStore vectorStore;

    public IngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public void ingest(Resource resource, String category) {
        // 1. Read
        List<Document> documents = new TikaDocumentReader(resource).get();

        // 2. Split
        List<Document> chunks = new TokenTextSplitter().apply(documents);

        // 3. Add metadata
        for (Document chunk : chunks) {
            chunk.getMetadata().put("source", resource.getFilename());
            chunk.getMetadata().put("category", category);
        }

        // 4. Generate embeddings and store
        vectorStore.add(chunks);
    }
}
```

Plain text or Markdown files don't need Tika; `new TextReader(resource).get()` is enough. The `vectorStore.add()` call generates embeddings with the configured `EmbeddingModel` and writes them to the `vector_store` table.

To load a folder at application startup:

```java
@Bean
ApplicationRunner ingestDocs(IngestionService ingestion,
                             @Value("classpath:docs/*.pdf") Resource[] pdfs) {
    return args -> Arrays.stream(pdfs).forEach(pdf -> ingestion.ingest(pdf, "manual"));
}
```

## 6. Similarity search

Before using an advisor, it's useful to see that the search returns the right results:

```java
List<Document> results = vectorStore.similaritySearch(
        SearchRequest.builder()
                .query("How do I reset my password?")
                .topK(5)
                .similarityThreshold(0.7)
                .filterExpression("category == 'faq'")
                .build());

results.forEach(d -> System.out.println(d.getScore() + " " + d.getMetadata().get("source")));
```

`filterExpression` filters on metadata (operators such as `==`, `!=`, `in`, `&&`, `||` are supported). This lets you, for example, make each customer search only their own documents.

## 7. RAG with QuestionAnswerAdvisor

`QuestionAnswerAdvisor` searches the vector store for the question on every request and adds the found chunks to the prompt:

```java
@RestController
public class AskController {

    private final ChatClient chatClient;

    public AskController(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder
                .defaultSystem("""
                        Answer using only the provided context.
                        If the answer is not in the context, say "I don't know".
                        """)
                .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder()
                                .topK(5)
                                .similarityThreshold(0.6)
                                .build())
                        .build())
                .build();
    }

    @GetMapping("/ask")
    public String ask(@RequestParam String q) {
        return chatClient.prompt().user(q).call().content();
    }
}
```

The "say you don't know if it's not in the context" instruction in the system prompt significantly reduces the model's tendency to make things up (hallucination).

## 8. Advanced: RetrievalAugmentationAdvisor

If you need a more modular flow, you can use `RetrievalAugmentationAdvisor` from the `spring-ai-rag` module. Steps such as query rewriting, multi-query expansion and document joining can be plugged in as separate components:

```java
Advisor ragAdvisor = RetrievalAugmentationAdvisor.builder()
        .documentRetriever(VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .similarityThreshold(0.5)
                .topK(5)
                .build())
        .build();

String answer = chatClient.prompt()
        .advisors(ragAdvisor)
        .user(question)
        .call()
        .content();
```

`QuestionAnswerAdvisor` is enough for simple scenarios; moving to this structure when you need it is easy.

## 9. Citing sources

For users to trust an answer, it's important to show which document it came from. The most transparent way is to do the search yourself and return the sources along with the answer:

```java
public record Answer(String text, List<String> sources) { }

public Answer ask(String question) {
    List<Document> docs = vectorStore.similaritySearch(
            SearchRequest.builder().query(question).topK(5).build());

    String context = docs.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n---\n"));

    String text = chatClient.prompt()
            .system("Use only this context:\n" + context)
            .user(question)
            .call()
            .content();

    List<String> sources = docs.stream()
            .map(d -> (String) d.getMetadata().get("source"))
            .distinct()
            .toList();

    return new Answer(text, sources);
}
```

## 10. Updating and deleting

When a document changes, you need to delete its old chunks and load it again. Since we wrote the source into the metadata, this is easy:

```java
vectorStore.delete("source == 'user-manual.pdf'");
ingestion.ingest(updatedResource, "manual");
```

You can also delete specific chunks with `vectorStore.delete(List.of(id1, id2))`. Storing a hash of the content in the metadata and comparing it avoids re-embedding unchanged documents over and over and lowers cost.

## 11. Tuning knobs

| Parameter | Effect | Starting value |
| --- | --- | --- |
| Chunk size | Small: more precise but fragmented context; large: more context but more noise | 500–800 tokens |
| `topK` | Number of chunks added to the prompt; cost and noise grow with it | 3–6 |
| `similarityThreshold` | Drops chunks with low similarity | 0.5–0.75 |
| `filterExpression` | Narrowing by tenant, category, language | As needed |
| Index type | HNSW is fast and accurate; uses memory on large data sets | HNSW |
| Embedding model | Balance of quality, dimensions and cost | `text-embedding-3-small` |

Tune these values by measuring with real questions, not by intuition.

## 12. Evaluating answers

Spring AI provides evaluators that check, with another model call, whether an answer is consistent with the retrieved context. They're handy for running the questions in a test set automatically:

```java
var evaluator = new RelevancyEvaluator(ChatClient.builder(chatModel));

EvaluationResponse result = evaluator.evaluate(
        new EvaluationRequest(question, docs, answer));

assertThat(result.isPass()).isTrue();
```

Beyond that, preparing a "golden set" of 20–50 questions and comparing results whenever you change the chunk size or `topK` is the most practical way to keep RAG quality in check.

## 13. Cost and performance notes

- Embeddings are generated once during ingestion; the real cost is the context added to the prompt on every query. Don't make `topK` and chunk size bigger than necessary.
- If question embeddings repeat often, they can be cached (e.g. in Redis).
- Building an HNSW index on large tables can take a long time; creating it after a bulk load is faster.
- Because vectors and business data live in the same PostgreSQL, you don't need extra infrastructure for backups, authorization and transactions.

## Conclusion

RAG is the most practical way to make LLMs talk with your own data, and with Spring AI it comes down to a few beans: read and split the documents, write them to pgvector, and add a `QuestionAnswerAdvisor` to `ChatClient`. What really determines quality is the details: the right chunk size, meaningful metadata, a clear system prompt and tuning based on measurement. If you already use PostgreSQL, pgvector is a great choice for getting started without moving to a separate vector database.
