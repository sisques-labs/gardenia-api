# Skill Registry — gardenia-api

Generated: 2026-05-29

## User Skills

### architecture (project-level — takes precedence)
**File**: `.claude/skills/architecture/SKILL.md`
**Triggers**: new context, new feature, add command, add query, add aggregate, new module, implement, create class, which layer, where does X go

**Compact Rules**:
- Constructor = hydration only. Never call `this.apply()` in constructors; events emitted from named instance methods only.
- Resolvers use `CommandBus.execute()` / `QueryBus.execute()` only — no direct service injection in transport.
- `MutationResponseGraphQLMapper` is global (provided by `AppModule`); never re-add to bounded-context modules.
- Repository interfaces live in `domain/repositories/`; infrastructure implements them; domain never imports from infrastructure.
- No `*.module.spec.ts` files.
- Unit tests: `jest.Mocked<T>`, co-located with source, no `@nestjs/testing`.
- File naming: `{name}.aggregate.ts`, `{verb}-{name}.command.ts`, `{name}-find-by-{x}.query.ts`, `{reason}.exception.ts`, `{name}.vo.ts`.
- Layer boundaries: business logic → domain/aggregates; orchestration → application/commands|queries; DB mapping → infrastructure/persistence/typeorm/mappers; HTTP/GQL wiring → transport (no logic).

### branch-pr
**File**: `~/.claude/skills/branch-pr/SKILL.md`
**Triggers**: creating, opening, or preparing PRs for review

**Compact Rules**:
- Check for linked GitHub issue before creating PR; create issue first if missing.
- PR title: `type(scope): short description` (conventional commits format, ≤70 chars).
- Body must include: Summary, Test plan, linked issue.
- No AI attribution in PR body or commits.

### chained-pr
**File**: `~/.claude/skills/chained-pr/SKILL.md`
**Triggers**: PRs over 400 lines, stacked PRs, review slices

**Compact Rules**:
- Split changes over 400 lines into chained PRs targeting each other (not main).
- Each PR must be independently reviewable and deployable.
- Base branch of chain PR N+1 = branch of PR N.
- Label PRs with `chained-pr` and sequence number.

### comment-writer
**File**: `~/.claude/skills/comment-writer/SKILL.md`
**Triggers**: PR feedback, issue replies, reviews, Slack messages, GitHub comments

**Compact Rules**:
- Warm, direct tone — no passive-aggressive or sarcastic comments.
- Lead with what's good before suggesting changes.
- Be specific: include file path + line number for code feedback.
- Keep comments actionable and short.

### issue-creation
**File**: `~/.claude/skills/issue-creation/SKILL.md`
**Triggers**: creating GitHub issues, bug reports, feature requests

**Compact Rules**:
- Check for duplicate issues before creating.
- Include: clear title, description, reproduction steps (bugs), acceptance criteria (features).
- Apply correct labels (bug/feature/chore).
- Link to related PRs or issues when relevant.

### work-unit-commits
**File**: `~/.claude/skills/work-unit-commits/SKILL.md`
**Triggers**: implementation, commit splitting, chained PRs, keeping tests and docs with code

**Compact Rules**:
- Each commit = one reviewable, self-contained unit of work.
- Tests travel with the production code they cover — never separate commits.
- Migration files commit together with entity and repository changes.
- Use conventional commits format; no AI attribution.
- Prefer many small commits over one large commit.

## Trigger Table

| Trigger Keywords | Skill |
|-----------------|-------|
| new context, add command, add query, aggregate, module, which layer, where does X go | architecture |
| creating PR, opening PR, preparing PR | branch-pr |
| PR over 400 lines, stacked PR, review slice | chained-pr |
| PR comment, issue reply, review comment, slack message | comment-writer |
| github issue, bug report, feature request | issue-creation |
| implementation, commit splitting, keep tests with code | work-unit-commits |
