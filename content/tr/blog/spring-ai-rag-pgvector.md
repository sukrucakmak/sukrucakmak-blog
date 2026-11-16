---
title: "Spring AI ve PostgreSQL pgvector ile RAG"
description: "Kendi dokümanlarınız üzerinde soru cevaplayan bir uygulama: Spring AI ile embedding üretme, pgvector'da saklama, benzerlik araması ve QuestionAnswerAdvisor ile prompt'u zenginleştirme."
date: 2026-11-25
tags: [java, spring, spring-ai, yapay zeka, postgresql, rehber]
translation: /en/blog/spring-ai-rag-pgvector
---

## Giriş

Büyük dil modelleri (LLM) genel bilgiye sahiptir ama şirket içi dokümanlarınızı, ürün kılavuzunuzu ya da geçen hafta yazılan runbook'u bilmez. Modeli yeniden eğitmek yerine kullanılan yaygın yöntem **RAG (Retrieval Augmented Generation)**: soruyla ilgili doküman parçalarını bulup prompt'a eklemek ve modelden yalnızca bu bağlama dayanarak cevap vermesini istemek.

Bu yazıda Spring AI ile uçtan uca bir RAG akışı kuracağız ve vektörleri ayrı bir vektör veritabanı yerine zaten kullandığımız PostgreSQL'de, **pgvector** eklentisiyle saklayacağız.

## 1. RAG nasıl çalışır?

Akış iki aşamadan oluşur:

**Yükleme (ingestion / ETL):**

1. Dokümanları okuyun (PDF, Markdown, HTML, DOCX...).
2. Küçük parçalara (chunk) bölün.
3. Her parça için bir **embedding** (anlamı temsil eden sayı vektörü) üretin.
4. Parçayı, metadata'sını ve vektörünü veritabanına yazın.

**Sorgulama:**

1. Kullanıcının sorusu için embedding üretin.
2. Vektör veritabanında en benzer parçaları bulun (retrieve).
3. Bu parçaları prompt'a bağlam olarak ekleyin (augment).
4. Modelden cevap üretmesini isteyin (generate).

Spring AI bu adımların her biri için soyutlama sağlar: `DocumentReader`, `TextSplitter`, `EmbeddingModel`, `VectorStore` ve `ChatClient` advisor'ları.

## 2. pgvector'ı Docker ile çalıştırma

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

Spring AI şemayı kendisi de oluşturabilir (aşağıda), ama eklentinin kurulu olduğunu `\dx` ile kontrol etmek iyi bir alışkanlıktır. psql komutları için PostgreSQL psql komutları yazısına göz atabilirsiniz.

## 3. Bağımlılıklar

Sürümleri Spring AI BOM'u yönetsin:

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
  <!-- Chat + embedding modeli -->
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
  <!-- PDF, DOCX, HTML okumak için -->
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-tika-document-reader</artifactId>
  </dependency>
</dependencies>
```

Yerel çalışmak isterseniz OpenAI yerine `spring-ai-starter-model-ollama` kullanabilirsiniz. Önemli bir not: **Anthropic (Claude) embedding modeli sunmaz.** Chat için Claude kullanıyorsanız embedding için OpenAI, Ollama ya da başka bir sağlayıcıyı birlikte kullanmanız gerekir.

## 4. Yapılandırma

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

`dimensions` değeri embedding modelinin ürettiği vektör boyutuyla **birebir aynı** olmalıdır (`text-embedding-3-small` için 1536). Modeli değiştirirseniz tabloyu ve tüm embedding'leri yeniden oluşturmanız gerekir. Production'da `initialize-schema: true` yerine tabloyu Flyway/Liquibase migration'ı ile oluşturmak daha kontrollüdür.

## 5. Dokümanları yükleme (ETL)

```java
@Service
public class IngestionService {

    private final VectorStore vectorStore;

    public IngestionService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public void ingest(Resource resource, String category) {
        // 1. Oku
        List<Document> documents = new TikaDocumentReader(resource).get();

        // 2. Böl
        List<Document> chunks = new TokenTextSplitter().apply(documents);

        // 3. Metadata ekle
        for (Document chunk : chunks) {
            chunk.getMetadata().put("source", resource.getFilename());
            chunk.getMetadata().put("category", category);
        }

        // 4. Embedding üret ve kaydet
        vectorStore.add(chunks);
    }
}
```

Düz metin ya da Markdown dosyaları için Tika'ya gerek yoktur; `new TextReader(resource).get()` yeterlidir. `vectorStore.add()` çağrısı embedding'leri yapılandırılmış `EmbeddingModel` ile üretir ve `vector_store` tablosuna yazar.

Uygulama açılışında bir klasörü yüklemek için:

```java
@Bean
ApplicationRunner ingestDocs(IngestionService ingestion,
                             @Value("classpath:docs/*.pdf") Resource[] pdfs) {
    return args -> Arrays.stream(pdfs).forEach(pdf -> ingestion.ingest(pdf, "manual"));
}
```

## 6. Benzerlik araması

Advisor kullanmadan önce aramanın doğru sonuç döndürdüğünü görmek faydalıdır:

```java
List<Document> results = vectorStore.similaritySearch(
        SearchRequest.builder()
                .query("Şifremi nasıl sıfırlarım?")
                .topK(5)
                .similarityThreshold(0.7)
                .filterExpression("category == 'faq'")
                .build());

results.forEach(d -> System.out.println(d.getScore() + " " + d.getMetadata().get("source")));
```

`filterExpression` metadata üzerinde filtre uygular (`==`, `!=`, `in`, `&&`, `||` gibi operatörler desteklenir). Bu sayede örneğin her müşterinin yalnızca kendi dokümanlarında arama yapmasını sağlayabilirsiniz.

## 7. QuestionAnswerAdvisor ile RAG

`QuestionAnswerAdvisor`, her istekte soruyu vektör deposunda arar ve bulunan parçaları prompt'a ekler:

```java
@RestController
public class AskController {

    private final ChatClient chatClient;

    public AskController(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder
                .defaultSystem("""
                        Sadece verilen bağlamı kullanarak cevap ver.
                        Bağlamda cevap yoksa "Bu konuda bilgim yok" de.
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

System prompt'taki "bağlamda yoksa bilmiyorum de" talimatı, modelin uydurma (hallucination) eğilimini ciddi şekilde azaltır.

## 8. Gelişmiş: RetrievalAugmentationAdvisor

Daha modüler bir akış gerekiyorsa `spring-ai-rag` modülündeki `RetrievalAugmentationAdvisor` kullanılabilir. Sorgu dönüştürme (query rewriting), çoklu sorgu ve doküman birleştirme gibi adımlar ayrı bileşenler olarak eklenebilir:

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

Basit senaryolar için `QuestionAnswerAdvisor` yeterlidir; ihtiyaç doğdukça bu yapıya geçmek kolaydır.

## 9. Kaynak gösterme

Kullanıcının cevaba güvenmesi için hangi dokümandan geldiğini göstermek önemlidir. En şeffaf yol, aramayı kendiniz yapıp kaynakları cevapla birlikte döndürmektir:

```java
public record Answer(String text, List<String> sources) { }

public Answer ask(String question) {
    List<Document> docs = vectorStore.similaritySearch(
            SearchRequest.builder().query(question).topK(5).build());

    String context = docs.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n---\n"));

    String text = chatClient.prompt()
            .system("Sadece şu bağlamı kullan:\n" + context)
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

## 10. Güncelleme ve silme

Bir doküman değiştiğinde eski parçalarını silip yeniden yüklemeniz gerekir. Metadata'ya kaynak bilgisini yazdığımız için bu kolaydır:

```java
vectorStore.delete("source == 'kullanim-kilavuzu.pdf'");
ingestion.ingest(updatedResource, "manual");
```

Belirli parçaları silmek için `vectorStore.delete(List.of(id1, id2))` da kullanılabilir. Değişmeyen dokümanları tekrar tekrar embed etmemek için içeriğin hash'ini metadata'da tutup karşılaştırmak maliyeti düşürür.

## 11. Ayar düğmeleri

| Parametre | Etkisi | Başlangıç değeri |
| --- | --- | --- |
| Chunk boyutu | Küçük: daha isabetli ama bağlam kopuk; büyük: daha fazla bağlam ama gürültü | 500–800 token |
| `topK` | Prompt'a eklenen parça sayısı; arttıkça maliyet ve gürültü artar | 3–6 |
| `similarityThreshold` | Düşük benzerlikteki parçaları eler | 0.5–0.75 |
| `filterExpression` | Kiracı, kategori, dil bazlı daraltma | İhtiyaca göre |
| Index tipi | HNSW hızlı ve isabetli; büyük veri setlerinde bellek kullanır | HNSW |
| Embedding modeli | Kalite, boyut ve maliyet dengesi | `text-embedding-3-small` |

Bu değerleri sezgiyle değil, gerçek sorularla ölçerek ayarlayın.

## 12. Cevapları değerlendirme

Spring AI, bir cevabın bulunan bağlamla tutarlı olup olmadığını başka bir model çağrısıyla kontrol eden değerlendiriciler sunar. Bir test setindeki soruları otomatik çalıştırmak için kullanışlıdır:

```java
var evaluator = new RelevancyEvaluator(ChatClient.builder(chatModel));

EvaluationResponse result = evaluator.evaluate(
        new EvaluationRequest(question, docs, answer));

assertThat(result.isPass()).isTrue();
```

Bunun yanında 20–50 soruluk bir "altın set" hazırlayıp chunk boyutu ya da `topK` değiştiğinde sonuçları karşılaştırmak, RAG kalitesini korumanın en pratik yoludur.

## 13. Maliyet ve performans notları

- Embedding üretimi yükleme sırasında bir kez yapılır; asıl maliyet her sorguda prompt'a eklenen bağlamdır. `topK` ve chunk boyutunu gereğinden büyük tutmayın.
- Soru embedding'leri sık tekrar ediyorsa cache'lenebilir (Redis gibi).
- HNSW index'i büyük tablolarda oluşturulması uzun sürebilir; toplu yüklemeden sonra oluşturmak daha hızlıdır.
- Vektörler ile iş verisi aynı PostgreSQL'de durduğu için yedekleme, yetkilendirme ve transaction'lar için ek bir altyapıya gerek kalmaz.

## Sonuç

RAG, LLM'leri kendi verinizle konuşturmanın en pratik yoludur ve Spring AI ile birkaç bean'den ibarettir: dokümanları okuyup bölün, pgvector'a yazın, `ChatClient`'a bir `QuestionAnswerAdvisor` ekleyin. Kaliteyi belirleyen asıl şey ise detaylardır: doğru chunk boyutu, anlamlı metadata, net bir system prompt ve ölçerek yapılan ayarlar. Zaten PostgreSQL kullanıyorsanız ayrı bir vektör veritabanına geçmeden başlamak için pgvector çok iyi bir seçimdir.
