---
title: "Tool Calling and MCP with Spring AI"
description: "Exposing your application's functions to an LLM with Spring AI — tool calling with @Tool, ToolContext, returnDirect, security, and setting up a Model Context Protocol (MCP) server and client."
date: 2026-11-24
tags: [java, spring, spring-ai, ai, guide]
translation: /blog/spring-ai-tool-calling-mcp
---

## Introduction

On its own, an LLM only knows the data it was trained on: it can't know today's date, the status of your order or a record in your database. **Tool calling** (function calling) lets you describe certain methods in your application to the model as "tools" and lets the model ask for them to be called when needed. **MCP (Model Context Protocol)** makes those tools shareable across applications and AI clients through a standard protocol.

This post follows up on the getting started with Spring AI post and assumes `ChatClient` and the basic setup are already in place.

## 1. How tool calling works

The key point: **the model does not run the tool itself.** The flow is:

1. The application sends the tools' names, descriptions and parameter schemas to the model along with the prompt.
2. If the model needs a tool to answer, it returns a "call this tool with these arguments" request instead of text.
3. Spring AI runs the corresponding Java method and sends the result back to the model.
4. The model uses the tool result to produce the final answer.

Spring AI manages this loop automatically; all you write is the method itself.

## 2. A first tool with @Tool

```java
class DateTimeTools {

    @Tool(description = "Returns the current date and time in the user's time zone")
    String currentDateTime() {
        return LocalDateTime.now().atZone(ZoneId.of("Europe/Istanbul")).toString();
    }

    @Tool(description = "Adds days to the given date and returns the result in ISO-8601 format")
    String addDays(
            @ToolParam(description = "ISO-8601 date, e.g. 2026-11-24") String date,
            @ToolParam(description = "Number of days to add") int days) {
        return LocalDate.parse(date).plusDays(days).toString();
    }
}
```

To give the tool to a single request, use `.tools(...)`:

```java
String answer = chatClient.prompt()
        .user("What date is it 45 days from today?")
        .tools(new DateTimeTools())
        .call()
        .content();
```

If it should be available on every request, register it when building the `ChatClient`:

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder, DateTimeTools dateTimeTools) {
    return builder
            .defaultTools(dateTimeTools)
            .build();
}
```

The `description` fields are the only information the model uses to decide **when** and **how** to use a tool. Keep them short but precise, and state parameter formats.

## 3. A realistic example: order status

```java
record OrderStatus(String orderNumber, String status, LocalDate estimatedDelivery) { }

@Component
class OrderTools {

    private final OrderRepository orders;

    OrderTools(OrderRepository orders) {
        this.orders = orders;
    }

    @Tool(description = "Returns the status and estimated delivery date of an order by its order number")
    OrderStatus getOrderStatus(
            @ToolParam(description = "Order number, e.g. ORD-12345") String orderNumber,
            ToolContext toolContext) {

        var customerId = (Long) toolContext.getContext().get("customerId");

        return orders.findByOrderNumberAndCustomerId(orderNumber, customerId)
                .map(o -> new OrderStatus(o.getOrderNumber(), o.getStatus().name(), o.getEstimatedDelivery()))
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));
    }
}
```

When a tool returns a record, Spring AI serializes the result to JSON and sends it to the model.

## 4. ToolContext: context the model never sees

The `customerId` above doesn't come from the model. Values like the user id or tenant must **never** be parameters the model fills in; otherwise a user could ask for another customer's data through the prompt. These values are supplied by the application via `ToolContext` and are not sent to the model:

```java
String answer = chatClient.prompt()
        .user("Where is my order ORD-12345?")
        .tools(orderTools)
        .toolContext(Map.of("customerId", currentUser.id()))
        .call()
        .content();
```

## 5. returnDirect

Sometimes the tool's result already is the final answer for the user and doesn't need to go back through the model:

```java
@Tool(description = "Returns the download link for the order's invoice PDF", returnDirect = true)
String invoiceLink(@ToolParam(description = "Order number") String orderNumber) {
    return "https://example.com/invoices/" + orderNumber + ".pdf";
}
```

With `returnDirect = true` the result goes straight back to the caller; there is no extra model call and no extra token cost.

## 6. Error handling and security

Tools run with your application's permissions. However good the model is, treat its arguments as untrusted user input.

| Rule | Why |
| --- | --- |
| Validate arguments | The model may produce values in the wrong format or malicious ones |
| Pass identity/authorization via `ToolContext` | Prevents access to another user's data through prompt injection |
| Separate read and write tools | Lets you authorize risky operations separately |
| Ask the user to confirm mutating operations | The model shouldn't cancel orders or make payments on its own |
| Return meaningful error messages | The model can relay "not found" properly to the user |
| Keep the number of tools small | Many tools increase the chance the model picks the wrong one |

When a tool throws an exception, Spring AI by default sends the error message back to the model, which can then explain it to the user. So don't leak messages that contain sensitive internals (SQL, stack traces).

## 7. MCP: Model Context Protocol

MCP is an open protocol that lets AI applications access tools, resources and prompts in a standard way:

- **MCP server**: Exposes tools (and resources). E.g. your order service.
- **MCP client**: Discovers those tools and offers them to its LLM. E.g. Claude Desktop, an IDE, or your own Spring AI app.
- **Transport**: `stdio` for local processes, an HTTP-based transport for remote servers.

The payoff: once you publish `OrderTools` as an MCP server, both your own applications and any MCP-capable client can use the same tools without code changes.

## 8. An MCP server with Spring AI

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>
```

Publish your `@Tool` methods with a `ToolCallbackProvider` bean:

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

Once the application starts, the `getOrderStatus` tool is reachable over MCP. If you expose a remote MCP server to the internet, don't forget to add authentication with Spring Security. You'll also need to design how user context travels with MCP calls (e.g. read it from a token).

## 9. An MCP client with Spring AI

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
</dependency>
```

To start a local MCP server over `stdio`:

```properties
spring.ai.mcp.client.stdio.connections.filesystem.command=npx
spring.ai.mcp.client.stdio.connections.filesystem.args=-y,@modelcontextprotocol/server-filesystem,/tmp/docs
```

Remote (HTTP) servers are also configured under `spring.ai.mcp.client`; since the supported transports and property names change between versions, check the documentation for the Spring AI version you use.

The client starter exposes the tools of connected servers as a `ToolCallbackProvider`. All you need is to hand it to `ChatClient`:

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder, ToolCallbackProvider mcpTools) {
    return builder
            .defaultToolCallbacks(mcpTools)
            .build();
}
```

Now the model can use the tools offered by MCP servers just like local `@Tool` methods.

## 10. A note on versions

The MCP specification and Spring AI's MCP support are evolving quickly. Annotation-based MCP APIs, transport options and property names can change between versions. Use the Spring AI line that matches your Spring Boot version (1.x for Boot 3.4/3.5, 2.x for Boot 4) and compare the examples with that version's reference documentation.

## Conclusion

Tool calling turns an LLM from a model that only generates text into an assistant that works with your application's data. In Spring AI, adding `@Tool` to a method and handing it to `ChatClient` is enough, and `ToolContext` keeps the security context separate from the model. With MCP you write the same tools once and open them to every AI client. The next step is letting the model answer from your own documents: RAG and vector databases.
