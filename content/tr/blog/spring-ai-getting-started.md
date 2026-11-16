---
title: "Spring AI'a Giriş: ChatClient, Prompt'lar, Structured Output ve Chat Memory"
description: "Spring AI ile bir Spring Boot uygulamasına LLM desteği eklemek — kurulum, ChatClient API'si, prompt şablonları, record'lara structured output, streaming ve konuşma hafızası."
date: 2026-11-23
tags: [java, spring, spring-ai, yapay zeka, rehber]
translation: /en/blog/spring-ai-getting-started
---

## Giriş

Spring AI, büyük dil modellerini (LLM) Spring uygulamalarına "Spring usulü" bağlamak için geliştirilen resmi projedir. Fikir tanıdık: JDBC veritabanından, Spring Data ise repository katmanından nasıl soyutluyorsa, Spring AI da model sağlayıcısından soyutlar. OpenAI, Anthropic, Ollama, Azure OpenAI, Bedrock, Vertex AI gibi sağlayıcılar arasında geçiş çoğu zaman bir starter ve birkaç property değişikliğinden ibarettir.

Temel soyutlamalar:

| Soyutlama | Ne işe yarar |
| --- | --- |
| `ChatModel` | Bir sohbet modeline düşük seviyeli erişim |
| `ChatClient` | `ChatModel` üzerinde akıcı (fluent) API — günlük kullanımda tercih edilen |
| `EmbeddingModel` | Metni vektöre çevirir (arama, RAG) |
| `VectorStore` | PgVector, Redis, Elasticsearch gibi vektör veritabanları için ortak arayüz |
| Advisor | İstek/yanıt etrafında çalışan ara katman: hafıza, RAG, loglama |

Bu yazıda sıfırdan bir Spring Boot uygulamasına sohbet, structured output, streaming ve konuşma hafızası ekleyeceğiz.

## 1. Kurulum

Spring AI bağımlılık sürümlerini bir BOM ile yönetir. Spring Boot sürümünüze uygun Spring AI serisini seçin: Boot 3.4/3.5 için **1.x**, Boot 4 için **2.x**.

```xml
<properties>
    <java.version>25</java.version>
    <spring-ai.version><!-- Boot sürümünüze uygun Spring AI sürümü --></spring-ai.version>
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

Sağlayıcıya göre starter:

| Sağlayıcı | Starter |
| --- | --- |
| OpenAI | `spring-ai-starter-model-openai` |
| Anthropic (Claude) | `spring-ai-starter-model-anthropic` |
| Ollama (yerel) | `spring-ai-starter-model-ollama` |

## 2. Yapılandırma

API anahtarını asla koda ya da repoya yazmayın; ortam değişkeninden okuyun:

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

Buradaki model adları sadece örnektir; sağlayıcınızın güncel model listesinden ihtiyacınıza uygun olanı seçin. `temperature` düşük değerlerde daha tutarlı, yüksek değerlerde daha yaratıcı yanıtlar üretir.

## 3. ChatClient ile ilk istek

Spring Boot, seçtiğiniz model için otomatik olarak bir `ChatClient.Builder` bean'i oluşturur. Bunu enjekte edip uygulamaya özel varsayılanlarla bir `ChatClient` kurarız:

```java
@Configuration
class AiConfig {

    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("Sen kıdemli bir Java geliştiricisisin. Kısa ve net yanıt ver.")
                .build();
    }
}
```

```java
String answer = chatClient.prompt()
        .user("Java'da record ile class arasındaki fark nedir?")
        .call()
        .content();
```

`prompt()` → mesajları kur, `call()` → modeli senkron çağır, `content()` → yanıt metnini al. Token kullanımı gibi meta verilere ihtiyacınız varsa `content()` yerine `chatResponse()` kullanabilirsiniz.

## 4. Prompt şablonları

Kullanıcı girdisini string birleştirme ile prompt'a eklemek yerine parametreli şablon kullanın:

```java
String summary = chatClient.prompt()
        .user(u -> u.text("{topic} konusunu 3 maddede, {level} seviyesindeki bir geliştiriciye anlat.")
                    .param("topic", "virtual threads")
                    .param("level", "junior"))
        .call()
        .content();
```

Uzun prompt'ları `src/main/resources/prompts/` altında dosya olarak tutup `@Value("classpath:prompts/review.st") Resource` ile yüklemek ve `.text(resource)` ile vermek de mümkündür. Böylece prompt'lar kod incelemesinden geçer ve versiyonlanır.

## 5. Structured output: yanıtı record'a dönüştürmek

LLM'den serbest metin yerine tipli bir nesne almak için `entity()` kullanılır. Spring AI, hedef tipten bir JSON şeması üretip prompt'a ekler ve yanıtı dönüştürür:

```java
record BookRecommendation(String title, String author, int year, String reason) { }

BookRecommendation book = chatClient.prompt()
        .user("Java concurrency öğrenmek isteyen birine tek bir kitap öner.")
        .call()
        .entity(BookRecommendation.class);
```

Generic tipler (ör. liste) için `ParameterizedTypeReference`:

```java
List<BookRecommendation> books = chatClient.prompt()
        .user("Spring öğrenmek için 3 kitap öner.")
        .call()
        .entity(new ParameterizedTypeReference<List<BookRecommendation>>() { });
```

Modelin çıktısı her zaman şemaya uymayabilir; dönen nesneyi Bean Validation ile doğrulamak ve dönüşüm hatalarını yakalamak iyi bir alışkanlıktır.

## 6. Streaming

Uzun yanıtlarda kullanıcının tamamını beklemesi yerine token'ları geldikçe göstermek için `stream()`:

```java
@GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<String> stream(@RequestParam String message) {
    return chatClient.prompt()
            .user(message)
            .stream()
            .content();
}
```

`stream()` Project Reactor'ın `Flux` tipini döner. Spring MVC de `Flux` dönüş tipini Server-Sent Events (SSE) olarak yazabilir; tamamen reaktif bir uygulama istiyorsanız `spring-boot-starter-webflux` kullanın.

## 7. Chat memory: konuşma hafızası

LLM'ler durumsuzdur (stateless): her istek önceki mesajları bilmez. Konuşma geçmişini taşımak için bir `ChatMemory` ve bunu prompt'a ekleyen `MessageChatMemoryAdvisor` kullanılır:

```java
@Bean
ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder()
            .maxMessages(20)          // son 20 mesajı tut
            .build();
}

@Bean
ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory) {
    return builder
            .defaultSystem("Sen yardımsever bir asistansın.")
            .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
            .build();
}
```

Her kullanıcı/konuşma için ayrı bir kimlik verilir:

```java
chatClient.prompt()
        .user(message)
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
        .call()
        .content();
```

Varsayılan depolama bellek içidir; uygulama yeniden başlayınca geçmiş kaybolur. Kalıcı hafıza için Spring AI'ın JDBC (ve diğer) chat memory repository starter'larından birini ekleyip `MessageWindowChatMemory`'ye ilgili repository'yi verebilirsiniz. Pencere boyutunu sınırlamak hem maliyeti hem de context taşmasını kontrol altında tutar.

## 8. Uçtan uca örnek: REST controller

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
                .system("Kodu güvenlik ve okunabilirlik açısından incele. Puan 1-10 arası.")
                .user(u -> u.text("İncelenecek kod:\n{code}").param("code", code))
                .call()
                .entity(CodeReview.class);
    }
}
```

```bash
curl -s localhost:8080/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Merhaba, adım Şükrü."}'
```

## 9. Hata ayıklama: SimpleLoggerAdvisor

Modele giden prompt'u ve gelen yanıtı görmek için:

```java
builder.defaultAdvisors(new SimpleLoggerAdvisor());
```

```properties
logging.level.org.springframework.ai.chat.client.advisor=DEBUG
```

Production'da bu logların kişisel veri içerebileceğini unutmayın.

## 10. Ollama ile yerelde çalışmak

API anahtarı ve maliyet olmadan denemek için Ollama:

```bash
ollama pull llama3.2
ollama serve
```

```properties
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.options.model=llama3.2
```

Starter'ı `spring-ai-starter-model-ollama` ile değiştirmeniz yeterli; `ChatClient` kullanan kodunuz aynı kalır.

## 11. Test

- Birim testlerde gerçek LLM çağırmayın: yavaş, ücretli ve deterministik değildir.
- AI çağrılarını kendi servis sınıfınızın arkasına alın ve testlerde o servisi mock'layın.
- Prompt kalitesini ölçmek için ayrı, isteğe bağlı çalışan entegrasyon testleri (ör. yerel Ollama ile) ve sabit bir örnek veri seti kullanın.

## Sonuç

Spring AI, LLM entegrasyonunu Spring geliştiricisinin zaten bildiği kavramlara indiriyor: starter, property, bean ve advisor. `ChatClient` ile birkaç satırda sohbet, `entity()` ile tipli yanıtlar, `stream()` ile akış ve `MessageChatMemoryAdvisor` ile hafıza elde edilebiliyor. Bir sonraki adım, modele uygulamanızın verisini ve fonksiyonlarını açmak: tool calling ve MCP.
