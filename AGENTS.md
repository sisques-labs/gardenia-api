# Agent Skills — gardenia-api

Project-specific skills injected into code agents working on this repo.

## Registered Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| [architecture](.claude/skills/architecture/SKILL.md) | new context, add command/query/aggregate, which layer, where does X go | DDD+CQRS+Hexagonal layer rules, file naming, and coding conventions |

## Usage

Skills are loaded by the orchestrator and injected into sub-agent prompts as `## Project Standards (auto-resolved)`. Agents do not read SKILL.md files directly.
