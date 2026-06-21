# Weather Context

Provides weather forecasts for a given location via an external provider
(Open-Meteo). Read-only context; follows the project's DDD + CQRS + Hexagonal
layering.

## Public API

### Queries

| Query | Purpose |
|-------|---------|
| `GetWeatherForecastQuery` | Forecast for a latitude/longitude |

### Transport

- Consumed by other contexts via the `WEATHER_PORT` adapter.
- MCP: see below.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`).
The tool dispatches through the Query bus.

| Tool | Action |
|------|--------|
| `weather_get_forecast` | Weather forecast for a latitude/longitude |
