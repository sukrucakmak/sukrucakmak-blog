---
title: "Spring AI ile Tool Calling ve MCP"
description: "Spring AI ile LLM'e uygulamanızın fonksiyonlarını açmak — @Tool ile tool calling, ToolContext, returnDirect, güvenlik ve Model Context Protocol (MCP) server/client kurulumu."
date: 2026-11-24
tags: [java, spring, spring-ai, yapay zeka, rehber]
translation: /en/blog/spring-ai-tool-calling-mcp
---

## Giriş

Bir LLM tek başına sadece eğitildiği veriyi bilir: bugünün tarihini, siparişinizin durumunu ya da veritabanınızdaki bir kaydı bilemez. **Tool calling** (function calling), modele uygulamanızdaki belirli metotları "araç" olarak tanıtıp gerektiğinde onları çağırmasını istemesine izin verir. **MCP (Model Context Protocol)** ise bu araçları standart bir protokolle farklı uygulamalar ve AI istemcileri arasında paylaşmayı sağlar.

Bu yazı, Spring AI'a giriş yazısının devamı niteliğinde; `ChatClient` ve temel kurulumun hazır olduğunu varsayıyor.

## 1. Tool calling nasıl çalışır?

Önemli nokta: **model aracı kendisi çalıştırmaz.** Akış şöyledir:

1. Uygulama, prompt ile birlikte araçların adını, açıklamasını ve parametre şemasını modele gönderir.
2. Model, cevap vermek için bir araca ihtiyaç duyarsa metin yerine "şu aracı şu argümanlarla çağır" isteği döner.
3. Spring AI ilgili Java metodunu çalıştırır ve sonucu modele geri gönderir.
4. Model, araç sonucunu kullanarak son yanıtı üretir.

Bu döngü Spring AI tarafından otomatik yönetilir; sizin yazdığınız tek şey metodun kendisidir.

## 2. @Tool ile ilk araç

```java
class DateTimeTools {

    @Tool(description = "Kullanıcının saat dilimindeki güncel tarih ve saati döner")
    String currentDateTime() {
        return LocalDateTime.now().atZone(ZoneId.of("Europe/Istanbul")).toString();
    }

    @Tool(description = "Verilen tarihe gün ekler ve sonucu ISO-8601 formatında döner")
    String addDays(
            @ToolParam(description = "ISO-8601 tarih, ör. 2026-11-24") String date,
            @ToolParam(description = "Eklenecek gün sayısı") int days) {
        return LocalDate.parse(date).plusDays(days).toString();
    }
}
```

Aracı tek bir isteğe vermek için `.tools(...)`:

```java
String answer = chatClient.prompt()
        .user("Bugünden 45 gün sonra hangi tarih?")
        .tools(new DateTimeTools())
        .call()
        .content();
```

Her istekte kullanılacaksa `ChatClient` oluşturulurken:

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder, DateTimeTools dateTimeTools) {
    return builder
            .defaultTools(dateTimeTools)
            .build();
}
```

`description` alanları modelin aracı **ne zaman** ve **nasıl** kullanacağına karar verdiği tek bilgidir. Kısa ama net yazın; parametrelerin formatını belirtin.

## 3. Gerçekçi örnek: sipariş durumu

```java
record OrderStatus(String orderNumber, String status, LocalDate estimatedDelivery) { }

@Component
class OrderTools {

    private final OrderRepository orders;

    OrderTools(OrderRepository orders) {
        this.orders = orders;
    }

    @Tool(description = "Sipariş numarasına göre siparişin durumunu ve tahmini teslim tarihini döner")
    OrderStatus getOrderStatus(
            @ToolParam(description = "Sipariş numarası, ör. ORD-12345") String orderNumber,
            ToolContext toolContext) {

        var customerId = (Long) toolContext.getContext().get("customerId");

        return orders.findByOrderNumberAndCustomerId(orderNumber, customerId)
                .map(o -> new OrderStatus(o.getOrderNumber(), o.getStatus().name(), o.getEstimatedDelivery()))
                .orElseThrow(() -> new IllegalArgumentException("Sipariş bulunamadı: " + orderNumber));
    }
}
```

Araç bir record döndüğünde Spring AI sonucu JSON'a çevirip modele gönderir.

## 4. ToolContext: modele gösterilmeyen bağlam

Yukarıdaki `customerId` modelden gelmiyor. Kullanıcı kimliği, tenant gibi değerler **asla** modelin doldurduğu bir parametre olmamalıdır; aksi halde kullanıcı prompt ile başka bir müşterinin verisini isteyebilir. Bu değerler `ToolContext` ile uygulama tarafından verilir ve modele gönderilmez:

```java
String answer = chatClient.prompt()
        .user("ORD-12345 numaralı siparişim nerede?")
        .tools(orderTools)
        .toolContext(Map.of("customerId", currentUser.id()))
        .call()
        .content();
```

## 5. returnDirect

Bazen aracın sonucu zaten kullanıcıya dönecek nihai cevaptır ve modelden tekrar geçirmeye gerek yoktur:

```java
@Tool(description = "Siparişin fatura PDF'inin indirme bağlantısını döner", returnDirect = true)
String invoiceLink(@ToolParam(description = "Sipariş numarası") String orderNumber) {
    return "https://example.com/invoices/" + orderNumber + ".pdf";
}
```

`returnDirect = true` ile sonuç doğrudan çağırana döner; ek bir model çağrısı ve token maliyeti olmaz.

## 6. Hata yönetimi ve güvenlik

Araçlar uygulamanızın yetkileriyle çalışır. Model ne kadar iyi olursa olsun, argümanları güvenilmeyen kullanıcı girdisi olarak düşünün.

| Kural | Neden |
| --- | --- |
| Argümanları doğrulayın | Model yanlış formatta ya da kötü niyetli değer üretebilir |
| Kimlik/yetki bilgisini `ToolContext` ile verin | Prompt injection ile başka kullanıcının verisine erişimi engeller |
| Okuma ve değiştirme araçlarını ayırın | Riskli işlemleri ayrı yetkilendirebilirsiniz |
| Değiştiren işlemlerde kullanıcı onayı alın | Sipariş iptali, ödeme gibi işlemleri model tek başına yapmamalı |
| Anlamlı hata mesajı dönün | Model "bulunamadı" bilgisini kullanıcıya düzgün aktarabilir |
| Araç sayısını sınırlı tutun | Çok sayıda araç modelin yanlış seçim yapma olasılığını artırır |

Bir araç exception fırlattığında Spring AI varsayılan olarak hata mesajını modele geri gönderir; model de bunu kullanıcıya açıklayabilir. Hassas iç bilgi (SQL, stack trace) içeren mesajları bu yüzden dışarı sızdırmayın.

## 7. MCP: Model Context Protocol

MCP, AI uygulamalarının araçlara, kaynaklara ve prompt'lara standart bir şekilde erişmesi için açık bir protokoldür:

- **MCP server**: Araçları (ve kaynakları) sunar. Ör. sipariş servisiniz.
- **MCP client**: Bu araçları keşfeder ve kendi LLM'ine sunar. Ör. Claude Desktop, bir IDE ya da sizin Spring AI uygulamanız.
- **Transport**: Yerel süreçler için `stdio`, uzak sunucular için HTTP tabanlı transport.

Kazanç şu: `OrderTools`'u bir kez MCP server olarak yayınladığınızda, aynı araçları hem kendi uygulamalarınız hem de MCP destekleyen herhangi bir istemci kod değişikliği olmadan kullanabilir.

## 8. Spring AI ile MCP server

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>
```

`@Tool` metotlarını bir `ToolCallbackProvider` bean'i ile yayınlayın:

```java
@Configuration
class McpServerConfig {

    @Bean
    ToolCallbackProvider orderToolProvider(OrderTools orderTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(orderTools)
                .build();
    }
}
```

```properties
spring.ai.mcp.server.name=order-service
spring.ai.mcp.server.version=1.0.0
```

Uygulama ayağa kalktığında `getOrderStatus` aracı MCP üzerinden erişilebilir olur. Uzak bir MCP server'ı internete açıyorsanız Spring Security ile kimlik doğrulama eklemeyi unutmayın. MCP üzerinden gelen çağrılarda kullanıcı bağlamını nasıl taşıyacağınızı (ör. token'dan okumak) ayrıca tasarlamanız gerekir.

## 9. Spring AI ile MCP client

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
</dependency>
```

Yerel bir MCP server'ı `stdio` ile başlatmak için:

```properties
spring.ai.mcp.client.stdio.connections.filesystem.command=npx
spring.ai.mcp.client.stdio.connections.filesystem.args=-y,@modelcontextprotocol/server-filesystem,/tmp/docs
```

Uzak (HTTP) server'lar için de `spring.ai.mcp.client` altında bağlantı tanımlanır; desteklenen transport'lar ve property adları sürümler arasında değiştiği için kullandığınız Spring AI sürümünün dokümantasyonuna bakın.

Client starter, bağlı server'lardaki araçları bir `ToolCallbackProvider` olarak sunar. Bunu `ChatClient`'a vermeniz yeterli:

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder, ToolCallbackProvider mcpTools) {
    return builder
            .defaultToolCallbacks(mcpTools)
            .build();
}
```

Artık model, MCP server'ların sunduğu araçları yerel `@Tool` metotları gibi kullanabilir.

## 10. Sürüm notu

MCP spesifikasyonu ve Spring AI'ın MCP desteği hızla gelişiyor. Annotation tabanlı MCP API'leri, transport seçenekleri ve property adları sürümler arasında değişebiliyor. Spring Boot sürümünüze uygun Spring AI serisini (Boot 3.4/3.5 için 1.x, Boot 4 için 2.x) kullanın ve örnekleri o sürümün referans dokümantasyonuyla karşılaştırın.

## Sonuç

Tool calling, LLM'i yalnızca metin üreten bir modelden uygulamanızın verisiyle çalışan bir asistana dönüştürüyor. Spring AI'da bir metoda `@Tool` eklemek ve onu `ChatClient`'a vermek yeterli; `ToolContext` ile güvenlik bağlamını modelden ayrı tutabiliyorsunuz. MCP ile de aynı araçları bir kez yazıp tüm AI istemcilerine açabilirsiniz. Sıradaki adım, modelin kendi dokümanlarınız üzerinden cevap vermesi: RAG ve vektör veritabanları.
