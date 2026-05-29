# Changelog

All notable changes to this project will be documented in this file.
## [0.5.3-alpha.0] - 2026-05-29

### Features
- **logging:** Implement Winston structured logging (5f1150f)
## [0.5.2-alpha.0] - 2026-05-29

### Chore
- Release v0.5.2-alpha.0 (53edf20)

### Features
- **database:** Implement required environment variables for PostgreSQL configuration (f29c595)
## [0.5.1-alpha.0] - 2026-05-29

### Chore
- Release v0.5.1-alpha.0 (5919b68)

### Features
- **app:** Integrate TypeORM with dynamic configuration for PostgreSQL (c98d593)
## [0.5.0-alpha.0] - 2026-05-28

### Chore
- Release v0.5.0-alpha.0 (eac83ff)

### Features
- **auth:** Add GET /auth/me and me GraphQL query (04da7d2)

### Refactor
- **auth:** Extract account view model mapping to dedicated mappers (827d2db)
- **auth:** Restructure transport layer per PR feedback (d4df9fd)
- **auth:** Inject builders via constructor, use domain AccountBuilder in REST mapper (60207cd)
- **auth:** Remove AccountObjectBuilder, use domain AccountBuilder in GQL mapper (ee117e0)
## [0.4.0-alpha.0] - 2026-05-28

### Bug Fixes
- **e2e:** Register auth session entity in test bootstrap (e4d7762)

### Chore
- Release v0.4.0-alpha.0 (573949e)

### Refactor
- **auth:** Address PR review feedback for auth sessions (038415c)
- **auth:** Split refresh token services by responsibility (e1dc67e)
- **auth:** Place refresh token services in own folders (95fae3a)
- **auth:** Use fromPrimitives in auth session builder (6689081)
- **auth:** Update handlers and tests for injectable token services (cd7c974)
- **auth:** Align refresh/logout commands with PR feedback (d5348da)
- **auth:** Use value objects in refresh/logout commands (4ad6909)
- **auth:** Remove active-session repo method and custom token error (1a45e55)
## [0.3.0-alpha.0] - 2026-05-28

### Chore
- Release v0.3.0-alpha.0 (5630bf6)

### Features
- **auth:** Implement change password endpoint (8bd53a3)

### Refactor
- **auth:** Align change password command and domain validation (9ed4e4d)
- **auth:** Move password validation flow to aggregate (179418d)
## [0.2.0-alpha.0] - 2026-05-28

### Chore
- **deps:** Add express as direct dependency (8533b9c)
- Update pnpm-store in .gitignore and upgrade @sisques-labs/nestjs-kit to v0.10.2 (13e3787)
- Release v0.2.0-alpha.0 (9535451)

### Features
- **auth:** Add AuthSession domain, infra and migration for refresh tokens (a76c173)
- **auth:** Implement refresh token rotation, logout, and cookie transport (0e422d3)

### Tech
- **auth:** Implement findByCriteria in AccountTypeOrmReadRepository (f2e7a78)
## [0.1.0-alpha.0] - 2026-05-27

### Bug Fixes
- **database:** Add collision guard to username backfill migration (f0cd6f5)
- **database:** Bump locale column to VARCHAR(20) for extended BCP-47 tags (de530a9)
- **users:** Add MaxLength(500) to bio in UserCreateRequestDto (d922c96)
- **database:** Inline DB env vars in data-source.ts — kit deep import blocked by package exports (e7b6ff9)
- **config:** Read DATABASE_DRIVER from env instead of hardcoding postgres (06b27a1)
- **auth:** Apply AccountCreatedEvent via create() to trigger register saga (bb79312)
- **lint:** Resolve all ESLint errors across codebase (3246342)
- **users:** Remove MutationResponseGraphQLMapper from UsersModule and drop module spec (5c57f1b)
- **e2e:** Use ReturnType<typeof request> for supertest v7 compatibility (01be1dd)
- **e2e:** Run suites serially and set createdAt/updatedAt in CreateUserCommandHandler (c95f2ba)
- **auth:** Hash password on register and map AccountAlreadyExistsException to 409 (cefbc6b)
- **users:** Forward all fields from UserUpdateRequestDto to UpdateUserCommand (b97613c)
- **auth:** Remove passwordHash from AccountViewModel (42bdda2)
- **users:** Make DeleteUserCommandHandler idempotent (7c6cda9)

### CI
- Add CI/CD workflows, Docker infrastructure and release automation (1abb71c)
- **package:** Add packageManager field for pnpm/action-setup@v4 (ca38139)

### Chore
- First commit (39ab79e)
- **setup:** Configure tsconfig strict mode, path aliases and install deps (a272045)
- **auth:** Update @sisques-labs/nestjs-kit to version 0.7.3, refactor repository imports and clean up code structure (64d0f9d)
- **auth:** Upgrade @sisques-labs/nestjs-kit to version 0.9.0, refactor account builders and update imports (6f83e79)
- **dependencies:** Upgrade @sisques-labs/nestjs-kit to version 0.10.0 and refactor user command handlers, removing deprecated register user functionality (0210b57)
- **dependencies:** Update @sisques-labs/nestjs-kit to version 0.10.1 and clean up app.module imports (313171a)
- **deps:** Update @sisques-labs/nestjs-kit to version 0.10.1 and clean up package-lock (20799fc)
- **husky:** Add pre-commit format/lint and pre-push build/test hooks (f03d645)
- **agents:** Add architecture skill with DDD+CQRS layer rules and conventions (83cf82b)
- **package:** Update version to 0.0.0, add description and author information (8ddb747)
- **package:** Update package name and add repository information (12f06b8)
- Release v0.1.0-alpha.0 (2f914f7)

### Documentation
- **readme:** Add auth, users, and core module documentation (86ed6fe)

### Features
- **core:** Add config factories, exception filter and AppModule wiring (aa27b10)
- **users:** Add user aggregate, domain repositories and events (cf97f1e)
- **users:** Add TypeORM entity and repository, Mongoose schema and read repository (aaf86c9)
- **users:** Add CQRS commands, queries, projection and wire UsersModule (5cbbb3f)
- **users:** Add REST controller, GraphQL resolver and DTOs (4736951)
- **auth:** Add strategies, guards, token service and login command (5f2b5a5)
- **auth:** Add REST login controller and GraphQL login resolver (a717afb)
- **core:** Finalize main.ts bootstrap, exception filter and clean up scaffold stubs (ca291e4)
- **users:** Add username field with VO, unique index, and findByUsername (9069030)
- **database:** Migration to enforce username NOT NULL with backfill on users table (2340ae9)
- **users:** Add firstName and lastName fields (5a82925)
- **users:** Add avatarUrl, bio, locale, and timezone fields (96d97d5)
- **database:** Migration for profile fields on users table (0719bc0)
- **users:** Expose profile fields in GraphQL DTOs and mapper (74240ec)
- **database:** Add TypeORM migrations directory and CLI data-source (1414637)
- **config:** Replace DATABASE_URL with individual DB env vars in postgres.config (d89f95e)
- **database:** Add migration npm scripts and update .env.example (7c8d973)
- **auth:** Implement register saga with compensation and fix login flow (7a1f72a)
- **database:** Add initial schema migration for accounts and users tables (4276719)
- **users:** Enhance CreateUserCommandHandler with logging for user creation process (2da0de0)
- **users:** Add timestamps to user creation in CreateUserCommandHandler (84bd702)
- **user:** Implement user creation logic and update tests (664e968)
- **users:** Implement findByCriteria with TypeORM pagination and no-op read-side save/delete (fc3eb32)
- **auth:** Implement DELETE /auth/account endpoint (df1a59f)

### Refactor
- **users:** Replace static factories with builder pattern and add toPrimitives (f527be2)
- **auth,users:** Extract AccountAggregate, separate auth credentials from user profile (42f0ff3)
- **auth:** Enhance AccountAggregate with password change and deletion events, update value objects (97bb9ab)
- **auth:** Update LoginUser and RegisterAccount commands to use value objects for email and user ID, enhance command handlers with event bus integration (bd076f3)
- **users:** Update UserAggregate and builders to use UserStatusValueObject, remove UserIdValueObject file (24b140b)
- **users:** Reorganize repository imports, replace deprecated interfaces with updated paths, and enhance UserAggregate with event handling (fa7f9ce)
- **users:** Remove GetCurrentUserQuery and its handler to streamline user query processing (dd35046)
- **users:** Simplify user query handling by removing unused GetCurrentUserQuery and its handler (e65cd32)
- **users:** Remove UserStatusEnum to streamline user status management (d89dbb7)
- **users:** Reorganize user module imports and remove obsolete Mongoose and TypeORM files (2e4bbd8)
- **users:** Update user command and query structures to use IUserPrimitives, remove obsolete GraphQL files, and enhance module organization (2ac6714)
- **users:** Reorganize UsersModule by consolidating command, query, and service handlers, and remove obsolete REST controller (49c3017)
- **auth:** Stabilize auth module and align with users module pattern (a852779)
- **users,auth:** CreateUserCommand generates own id/username, RegisterAccount awaits userId (d18f391)
- **users:** Remove userCreate GraphQL mutation and UserCreateRequestDto (8fb87f1)
- **auth:** Simplify command execution in RegisterAccountCommandHandler (29cadde)
- **auth:** Extract AssertAccountEmailAvailableService from RegisterAccountCommandHandler (31740b0)
- **package:** Rename start scripts for consistency and clarity (540a402)
- Remove MongoDB, use TypeORM for read and write (abbf4d4)

### Testing
- **users:** Unit tests for UserAggregate (f46657e)
- **users:** Expand test coverage for all profile fields (736eccc)
- **transport:** Add unit tests for auth/user resolvers, controller, and users module (32894a8)
- **e2e:** Add auth and users E2E tests with real Postgres, Docker, and CI job (bc2d47f)

