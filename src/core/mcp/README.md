# MCP (Model Context Protocol)

Exposes the API to AI tools (Claude, IDEs, agents, …) as a set of **MCP tools**.
Each bounded context contributes its own tools; this `core/mcp` module owns the
shared transport and discovery wiring.

## At a glance

- **SDK**: official `@modelcontextprotocol/sdk` (`McpServer` + `StreamableHTTPServerTransport`).
- **Transport**: Streamable HTTP, **stateless** (a fresh server per request).
- **Endpoint**: `POST /api/mcp` (`GET`/`DELETE` return `405` — no sessions).
- **Auth/tenancy**: reuses the global `OptionalJwtAuthGuard` + `SpaceGuard` +
  `SpaceInterceptor`. Every request **MUST** send `Authorization: Bearer <jwt>`
  and `X-Space-ID: <spaceId>`, exactly like the rest of the API.
- **Layer**: tools live in each context's `transport/mcp/` — they are inbound
  protocol adapters (like resolvers/controllers) and only dispatch through the
  Command/Query bus.

## How it fits together

```
POST /api/mcp
  → OptionalJwtAuthGuard (sets req.user)
  → SpaceGuard           (validates X-Space-ID, sets req.spaceId)
  → SpaceInterceptor     (wraps handler in tenant ALS frame)
  → McpController
      → McpServerFactory.create({ userId, email, spaceId })   // per request
          → registers every discovered IMcpTool on a new McpServer
      → StreamableHTTPServerTransport.handleRequest(req, res, body)
          → tool.execute(args, context)
              → CommandBus / QueryBus.execute(...)   // resolves within the space
```

Because the server is built per request and tool handlers close over the
request's `IMcpToolContext`, multi-tenancy isolation is strict: a request can
only act as its authenticated user inside its own space. Tenant repositories
keep reading the space id from `SpaceContext` (ALS), so no tool wiring is needed
for tenancy.

## Building blocks

| File | Responsibility |
|------|----------------|
| `interfaces/mcp-tool.interface.ts` | `IMcpTool` contract every tool implements |
| `interfaces/mcp-tool-context.interface.ts` | per-request auth/tenancy context |
| `decorators/mcp-tool.decorator.ts` | `@McpTool()` — marks a provider for discovery |
| `services/mcp-tool-registry.service.ts` | discovers tagged tools at bootstrap |
| `services/mcp-server.factory.ts` | builds a per-request `McpServer` |
| `transport/mcp.controller.ts` | the `/api/mcp` Streamable HTTP endpoint |
| `mcp.module.ts` | wires the transport (imported once in `AppModule`) |

## Adding tools to a bounded context

1. Create `src/contexts/{context}/transport/mcp/tools/{name}.tool.ts`:

   ```ts
   @McpTool()
   @Injectable()
   export class FooCreateTool implements IMcpTool {
     private readonly logger = new Logger(FooCreateTool.name);

     readonly name = 'foo_create';
     readonly title = 'Create foo';
     readonly description = 'Creates a foo in the current space.';
     readonly inputSchema = { name: z.string().min(1) };

     constructor(private readonly commandBus: CommandBus) {}

     async execute(
       args: Record<string, unknown>,
       context: IMcpToolContext,
     ): Promise<CallToolResult> {
       const { name } = args as { name: string };
       this.logger.log(`Creating foo for user: ${context.userId}`);
       const id = await this.commandBus.execute(
         new CreateFooCommand({ name, userId: context.userId }),
       );
       return { content: [{ type: 'text', text: JSON.stringify({ id }) }] };
     }
   }
   ```

2. Register the tool classes in the module via an `MCP_TOOLS` array and spread it
   into `providers` (the `@McpTool()` metadata makes them discoverable globally —
   no need to export them).

### Conventions

- **Bus only** — tools dispatch Commands/Queries, never inject services/repos.
- **Naming** — `snake_case` tool names, prefixed by the entity (`plant_create`).
- **Auth** — read the acting user from the injected `IMcpToolContext.userId`;
  never trust an id passed in `args` for ownership.
- **Logging** — log at entry (transport rule), like resolvers/controllers.
- **Input** — describe every field with `.describe(...)` so the AI client has
  good schemas.

## TypeScript note

The SDK is ESM-only and ships its public API behind the package `exports` map,
which the project's `node10` module resolution does not read for type lookup.
Three `paths` aliases in `tsconfig.json` map the `*.js` specifiers to the SDK's
type declarations **for `tsc` only** — the emitted `require(...)` strings are
untouched and resolved by Node at runtime via the `exports` map.

## Reference implementation

See `src/contexts/plants/transport/mcp/` for the first context wired end to end
(`plant_find_by_id`, `plant_find_by_criteria`, `plant_create`, `plant_update`,
`plant_delete`).
