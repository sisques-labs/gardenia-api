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

1. Define the input schema in its own file under
   `src/contexts/{context}/transport/mcp/schemas/{name}.schema.ts`:

   ```ts
   import { z } from 'zod';

   export const fooCreateSchema = {
     name: z.string().min(1).describe('Display name of the foo'),
   };
   ```

2. Create `src/contexts/{context}/transport/mcp/tools/{name}.tool.ts`:

   ```ts
   @McpTool()
   @Injectable()
   export class FooCreateMcpTool implements IMcpTool {
     private readonly logger = new Logger(FooCreateMcpTool.name);

     readonly name = 'foo_create';
     readonly title = 'Create foo';
     readonly description = 'Creates a foo in the current space.';
     readonly inputSchema = fooCreateSchema;

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

3. Register the tool classes in the module via an `MCP_TOOLS` array and spread it
   into `providers` (the `@McpTool()` metadata makes them discoverable globally —
   no need to export them).

### Conventions

- **Schemas** — each tool's Zod `inputSchema` lives in its own file under
  `transport/mcp/schemas/`, never inline in the tool.
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

## Wired contexts

Every bounded context exposes its queries and commands as tools under
`transport/mcp/` (see `src/contexts/plants/transport/mcp/` as the reference):

| Context | Tools |
|---------|-------|
| plants | find by id/criteria, create, update, delete |
| care-log | create, update, delete, find by criteria, find last by type |
| harvests | create, update, delete, find by id/criteria |
| inventory | create, update, adjust quantity, delete, find by id/criteria |
| plant-species | create, update, delete, enrich, import, find by id/criteria |
| planting-spots | create, update, delete, find by id/criteria |
| qr | create, regenerate, delete, find by id |
| spaces | create, update, add/remove member, create/accept invitation, find by id, list mine, weather |
| users | update (self), find by id/criteria |
| weather | get forecast |

**Not exposed:** the `auth` context. Its commands are credential/session flows
(login, register, OAuth, refresh-token, logout, change/delete-account) that are
unsafe or meaningless as AI tools, and its queries read account/PII data.
Exposing it would need an explicit, separate decision.

## Cursor IDE setup

1. Start the API locally (`pnpm start:dev`).
2. Copy `.cursor/mcp.json.example` to `.cursor/mcp.json`.
3. Replace `<jwt>` with a valid access token (e.g. from `POST /api/auth/login`).
4. Replace `<space-id>` with the space you want the agent to act in.

Cursor loads project MCP servers from `.cursor/mcp.json` (gitignored — never
commit real tokens). Restart Cursor or reload MCP servers after editing the file.
