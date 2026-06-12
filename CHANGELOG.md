# Changelog

All notable changes to this project will be documented in this file.
## [0.15.2] - 2026-06-12

### CI
- **release-train:** Serialize release channels with a repo-wide concurrency group (#237) (2d74c92)
## [0.15.2-alpha.3] - 2026-06-11

### CI
- **release-train:** Freeze package.json version to 0.0.0-dev on develop (d43b56d)

### Chore
- Release v0.15.1-beta.2 (32f9ddd)
## [0.15.1-beta.2] - 2026-06-11

### Chore
- Update version to 0.15.0-beta.0 (607f541)
- Update version to 0.15.1-beta.0 (d55aaff)
- Release v0.15.1-beta.1 (3b792fa)
- Release v0.15.1 (6450dd7)
## [0.15.1-beta.1] - 2026-06-11

### Bug Fixes
- **plant-species:** Add TODO comment to verify adapter correctness (269e303)
- **spaces:** Update expired invitation test date to 2099 (5785988)
- **auth:** Builder withAppRole accepts string primitive, not VO (0642316)
- **auth:** Add appRole to CurrentUserPayload mocks in transport specs (744fa8d)
- **auth:** Add appRole to CurrentUserPayload mocks in planting-spots and plants specs (9566ac3)
- **spaces:** Update expiration date for space invitations (276bbde)

### CI
- **docker:** Trigger build only on pull requests (3a53a58)
- Trigger CI workflow only on pull requests (80d1b8b)
- Auto-open promotion PRs on merge to develop and staging (5a9f4e6)
- Remove auto-promote workflow (e1e90d9)
- Add PR template for promotion PRs (546bf64)

### Chore
- Release v0.15.0-alpha.0 (2e72c1a)
- **migrations:** Add CHECK constraint to app_role column (59ef097)
- Release v0.15.0-alpha.1 (d9c8d6d)
- Release v0.15.0-alpha.2 (44afcf3)
- Release v0.15.0-alpha.3 (9969c4e)
- Add docker-compose for local PostgreSQL development (af6bd61)
- Release v0.15.0-alpha.4 (38c23ad)
- Release v0.15.0-alpha.5 (d56d0ee)
- Release v0.15.0-alpha.6 (291328f)
- Release v0.15.0-beta.0 (2390260)
- Fix version back to alpha pre-release on develop (44b4583)
- Release v0.15.0-alpha.7 (3eb5f96)
- Release v0.15.0-beta.0 (ae1c3f5)
- Merge staging into develop to align histories (037a28a)
- Release v0.15.0-alpha.8 (52aa3ef)
- Release v0.15.0 (654097e)

### Documentation
- **auth:** Rewrite README to cover sessions, OAuth, RBAC, and full API (0073d31)

### Features
- **plant-species:** Enrich catalog and add bulk import from GBIF (81efc60)
- **plant-species:** Add enrich command with GBIF validation gate (84b1e65)
- **plants:** Align linked species view model with plant-species catalog (312f91c)
- **auth:** Implement app-level RBAC with ADMIN and USER roles (28d5810)

### Refactor
- **plant-species:** Address PR review on import command and GBIF types (a392dcf)

### Testing
- **spaces:** Fix invitation expiry fixture past current date (397c16f)
## [0.15.0-beta.0] - 2026-06-09

### Bug Fixes
- **spaces:** Address PR review feedback on invitations (425a085)
- **spaces:** Return spaceId from accept invitation and make it idempotent (2a949f9)

### Chore
- Release v0.14.1-alpha.1 (746335c)
- Release v0.14.1-alpha.2 (31a1340)
- Release v0.14.1-beta.0 (52c7d40)
- Release v0.14.1 (dc3cc74)

### Documentation
- **spaces:** Add module README for spaces and invitations (7a26a4d)

### Features
- **spaces:** Add QR and code space invitations (f8be488)

### Refactor
- **spaces:** Extract invitation assert services (4046af4)
- **spaces:** Apply second round of PR review feedback (477b6f0)
- **config:** Register spaces config namespace (5d03d05)
- **spaces:** Move spaces config to bounded context infrastructure (c4f0dde)
- **spaces:** Update date validation in SpaceCreateInvitationRequestDto (e04757e)
- **spaces:** Remove unused SpaceContext from SpacesModule (df11e61)
- **spaces:** Drop EnsureUserExists from invitation accept flow (0cdbde2)
- **spaces:** Reorganize imports and add TODO for invitation handling (ddfd52c)
## [0.14.1-beta.0] - 2026-06-08

### Bug Fixes
- **auth:** Reset AuthSessionBuilder state on each withId chain (56f7bff)

### CI
- Add release train workflow for develop/staging/main (5e012fd)
## [0.14.1-alpha.0] - 2026-06-06

### Bug Fixes
- **graphql:** Enable fieldResolverEnhancers for tenant context (b94d795)

### Chore
- Release v0.14.1-alpha.0 (05b7077)

### Documentation
- **openspec:** Document graphql field resolver space context fix (c71ca8a)
## [0.14.0-alpha.0] - 2026-06-05

### Chore
- Release v0.14.0-alpha.0 (8981480)

### Documentation
- **openspec:** Add qr-expires-at change proposal (c1f02ed)

### Features
- **qr:** Add expiresAt field with expiry enforcement (5cd6adf)

### Refactor
- **qr:** Move expiresAt validation to aggregate.checkExpiresAt() (826d20b)
## [0.13.0-alpha.0] - 2026-06-04

### Bug Fixes
- **auth:** Clear refresh cookie on token rotation failure (f21df78)
- **auth:** Fix logoutAll no-op, cookie clear, refresh rotation lock and ConfigService migration (96f24ea)
- **auth:** Lazy-validate OAUTH_TOKEN_ENC_KEY to avoid startup failure when key is absent (d3001e0)
- **auth:** Migrate OAuth strategies and controller from OAuthUserProfile to LoginWithOAuthCommandInput (21b5c5e)
- **auth:** Update OAuthProviderName import to domain/enums (f1ef6d2)
- **auth:** Use non-empty fallback for OAuth credentials to prevent startup failure in CI (b8d0246)
- **auth:** Register OAuth strategies conditionally when credentials are configured (06f0caf)

### Chore
- **sdd:** Add auth-improvement openspec artifacts (b711faa)
- **env:** Add OAuth environment variables to .env.example (1ac4062)
- **sdd:** Archive auth-improvement openspec artifacts (c9b2bb2)
- Release v0.13.0-alpha.0 (2d7418c)

### Features
- **auth:** Add OAuth foundation — domain model, persistence and command handlers (c8fd955)
- **auth:** Add OAuth provider adapters — Google, GitHub and Apple (caea9ec)

### Refactor
- **auth:** Move RotateResult type to domain/interfaces (4d1aed0)
- **auth:** Remove RotateResult re-export from repository; import from interfaces directly (f283c9b)
- **auth:** Fix architectural violations per PR review (3ba2afb)
- **auth:** Wrap all command fields as value objects in OAuth commands (c28e009)
- **auth:** EmailVerified as BooleanValueObject; mapper uses toDomain/toPersistence with builder chaining (26e834f)
- **auth:** Remaining aggregate VOs, OAuthIdentityViewModel, event interface, remove redundant re-exports (07030c1)
- **auth:** Move IOAuthIdentityLinkedEventData to domain/events/interfaces (607ea3e)
- **auth:** Move OAuth strategies to own subfolders; use OAuthProviderEnum in registry (3fd9136)
## [0.12.0-alpha.0] - 2026-06-03

### Chore
- Release v0.12.0-alpha.0 (529e3ff)
## [0.11.2-alpha.0] - 2026-06-03

### Chore
- Release v0.11.2-alpha.0 (3015c57)

### Refactor
- **filters:** Move exception-to-status mapping into per-context transport filters (c290b94)
## [0.11.1-alpha.0] - 2026-06-03

### Bug Fixes
- **config:** Make synchronize and migrationsRun configurable via env vars (2ecd57e)
- **config:** Default migrationsRun to true, synchronize to false (5a82f9e)

### Chore
- Release v0.11.1-alpha.0 (ac86668)

### Testing
- **config:** Update migrationsRun assertions for new default-true behavior (4f51703)
## [0.11.0-alpha.0] - 2026-06-03

### Bug Fixes
- **planting-spots:** Add JwtAuthGuard to GraphQL resolvers (08d00d2)
- **planting-spots:** Resolve merge conflict markers in SC-16 test (d721b73)
- **planting-spots:** Register PlantingSpotBuilder as module provider (de92949)
- **planting-spots:** Align enum values to lowercase and fix integration test signatures (9fe0ed5)
- **planting-spots:** Remove extra spaceId arg from write repo integration test findById calls (a273b05)
- **planting-spots:** Remove unnecessary spaceId argument from findById method in adapter and tests (fd4cfab)
- **plants:** Pass PlantPlantingSpotBuilder to PlantingSpotAdapter in unit test (6846b91)
- **plants:** Inject PlantGraphQLMapper in resolved-fields resolver unit test (8b460db)
- **spaces:** Use fresh builder in joinedAt timing test to avoid flake (af7fb49)

### Chore
- Release v0.11.0-alpha.0 (6321458)

### Features
- **planting-spots:** Add domain and application layers (30698c8)
- **planting-spots:** Add infrastructure layer (0e3566a)
- **planting-spots:** Implement PlantingSpotInUseAdapter via QueryBus (278c639)
- **planting-spots:** Add transport layer and module wiring (37fbd9f)
- **planting-spots:** Wire PlantingSpotInUseAdapter in module (50c3b47)
- **planting-spots:** Add e2e and integration tests (bc20a38)
- **planting-spots:** Add e2e and integration tests (0bbeae7)
- **plants:** Add plantingSpotId field and plantingSpot resolved field (80b46b5)
- **planting-spots:** Add e2e and integration tests (8e504b0)

### Refactor
- **planting-spots:** Align domain+application with project conventions (81fc3dc)
- **planting-spots:** Align infrastructure with base repository interfaces (c59eb79)
- **planting-spots:** Use Criteria from nestjs-kit in transport layer (62296a8)
- **plants:** Migrate qr and species to @ResolveField (bfa9065)
- **planting-spots:** Update command inputs to use IPlantingSpotPrimitives (9f1c5f9)
- **planting-spots:** Update UpdatePlantingSpotCommand to use 'id' consistently (ac21513)
- **planting-spots:** Standardize DeletePlantingSpotCommand to use 'id' property (602a3c3)
- **planting-spots:** Unify command handlers to use 'id' property (5b8b2ea)
- **planting-spots:** Update PlantingSpotFindByIdQuery to use 'id' property (54f31f4)
- **planting-spots:** Add TODO for enum implementation in PlantingSpotInUseAdapter (c702253)
- **planting-spots:** Enhance PlantingSpotTypeOrmMapper and repository to use view models (a177696)
- **planting-spots:** Align GraphQL transport with project conventions (29af759)
- **base-exception-filter:** Reorganize exception imports and add new exceptions (adb3f0a)
- **planting-spots:** Rename controller methods for consistency (cdc7ec2)
- **planting-spots:** Update import paths for consistency (62ca558)
- **planting-spots:** Rename DOMAIN_PROVIDERS to DOMAIN_BUILDERS for clarity (c134e5b)
- **planting-spots:** Streamline GraphQL resolvers with JwtAuthGuard (faa2a00)
- **planting-spots:** Remove JwtAuthGuard from PlantingSpotQueriesResolver (ab349f2)
- **plants:** Address PR review — primitives, builder, and mapper for PlantPlantingSpotViewModel (6dbe8af)
- **plants:** Split resolved fields into dedicated resolvers with mapper methods (970ab7e)
- **plants:** Drop qr/species from REST response — GraphQL-only via ResolveField (bc6a4e6)

### Testing
- **planting-spots:** Relax SC-16 constraint to allow Phase 2 adapters (b964fc8)
## [0.10.1-alpha.0] - 2026-06-02

### Bug Fixes
- **auth:** Set refresh_token cookie path to / for middleware visibility (00ee60d)

### Chore
- **dependabot:** Target dedicated updates branch (a43b3db)
- **ci:** Validate multi-arch docker smoke build (cc9fe28)
- Release v0.10.1-alpha.0 (d742d68)
## [0.10.0-alpha.0] - 2026-06-01

### Chore
- **openspec:** Archive health-module change artifacts (d31f923)
- Release v0.10.0-alpha.0 (654fbea)

### Features
- **health:** Add liveness health check endpoint (25c605c)
## [0.9.1-alpha.0] - 2026-06-01

### Bug Fixes
- **auth:** Bypass SpaceGuard on identity-scoped endpoints without @UseGuards (c81e393)
- **auth:** Bypass tenant isolation for identity-scoped account/user ops (6fd091c)

### Chore
- Release v0.9.1-alpha.0 (6a7896b)

### Documentation
- **openspec:** Document @IdentityOnly decorator and tenant bypass pattern (5a84898)
## [0.9.0-alpha.0] - 2026-05-31

### Bug Fixes
- **app:** Resolve webpack bootstrap failure after plant-species (020017b)
- **plant-species:** Address PR review comments (d1450c5)
- **plant-species:** Rename graphql queries to match project naming convention (a12a5de)

### Chore
- **changelog:** Revert unreleased section (c20ab44)
- Release v0.9.0-alpha.0 (2bd31e5)

### Documentation
- **qr:** Add module README for new contributors (2e5ba43)

### Features
- **plant-species:** Add global catalog and link plants via plantSpeciesId (252f355)

### Refactor
- **plant-species:** Use @contexts path aliases for all intra-module imports (06f53ab)

### Testing
- **plant-species:** Update aggregate spec for changeName() event order (d9117d4)
## [0.8.0-alpha.0] - 2026-05-31

### Bug Fixes
- **plants:** Create QR before persisting plant to satisfy FK constraint (be7639f)

### Chore
- **openspec:** Archive plant-qr-generation change (8deb241)
- **openspec:** Add logging convention to apply rules (ab4a63e)
- **openspec:** Sync delta specs to main specs for plant-qr-generation (473009c)
- Release v0.8.0-alpha.0 (78f7653)

### Features
- **qr:** Add plant-linked QR bounded context (d20756c)
- **plant:** Add logging to PlantFindByIdQueryHandler (4cbd437)
- **plant:** Enhance logging in EnrichPlantWithQrService (90ce75b)
- **plant:** Add withTargetUrl method to PlantBuilder (d8af588)
- **qr:** Add logging to query handlers, REST controller and PNG generator (bd2cb39)
- **plants:** Add nested qr view model to plant read responses (bf274ce)
- **plants:** Enhance QR integration with view model decoupling (3293816)

### Refactor
- **qr:** Generic QRs, plant-owned links, and DB cascade FKs (4a36aec)
- **qr:** Consolidate migrations and dual plant-delete cascade (5ce20d4)
- **plant:** Reorganize imports in plant-find-by-criteria handler (4c8eb2a)
- **plant:** Streamline import statements in plant-find-by-id handler (7fabddf)
- **plants:** Align PlantQrTargetUrlBuilder with IBaseService (72cac29)
- **plant:** Update import statements in plant.builder.ts for consistency (203fbe1)
- **tsconfig:** Add path alias for shared module (7ca9309)
- **plant:** Utilize PlantBuilder in EnrichPlantWithQrService for improved object construction (5553e7e)
- **qr:** Replace relative imports with @ path aliases (714e2f8)
- **plant:** Update import statement in plant.view-model.ts to use absolute path alias (5cea65f)
- **qr:** Use value objects in commands and queries (8855a52)
- **qr:** Replace generation primitive with QrGenerationValueObject (d18f1d3)
- **plants:** Extract IPlantQrPrimitives for PlantQrViewModel constructor (31347f2)

### Testing
- **qr:** Add unit and e2e coverage for plant QR module (c480680)
- **qr:** Add missing test coverage for qr bounded context (f8e6c08)
## [0.7.1-alpha.0] - 2026-05-31

### Chore
- Release v0.7.1-alpha.0 (8cb2acf)

### Features
- **spaces:** Add GraphQL transport layer (59389d1)
## [0.7.0-alpha.0] - 2026-05-30

### Bug Fixes
- **plants:** Use value objects in commands, interface, and aggregate; add field-changed events (935ce7e)
- **plants:** Extract repository bindings into INFRASTRUCTURE_REPOSITORIES constant (9f0b9c7)

### Chore
- Release v0.7.0-alpha.0 (5a18bb1)

### Documentation
- **integration-tests:** Update task documentation and add new convention for testing (83e8298)
- **openspec:** Archive plant-context change — all 27 tasks complete (a664bea)

### Features
- **plants:** Add domain and application layer for plants bounded context (339e7eb)
- **plants:** Add infrastructure layer and module wiring for plants context (558f27e)
- **plants:** Add REST and GraphQL transport layer with E2E tests (8299611)

### Testing
- Add integration test infrastructure (phase 1) (287d558)
- Add pilot integration specs for tenant isolation (phase 2) (66c8d88)
- Use migrations in integration tests (phase 3) (bb8c871)
- Add optional Testcontainers for local DB tests (phase 4) (9a4ce25)
- Align E2E tests with migrations instead of synchronize (phase 5) (4852e48)
- Harden integration test maintenance and archive change (phase 6) (44c7c84)
## [0.6.1-alpha.0] - 2026-05-30

### Bug Fixes
- **spaces:** Address verify warnings and suggestions (48874f4)

### Chore
- Release v0.6.1-alpha.0 (0ee2e33)

### Documentation
- **openspec:** Add proposal, tasks, progress and verify report for spaces REST controller (18090c2)
- **openspec:** Verify and archive spaces-rest-controller change (14de9bb)

### Features
- **spaces:** Application layer fixes for REST controller (PR1 of 2) (b98d6e1)
- **spaces:** Add REST controller, DTOs, mapper and module wiring (PR2 of 2) (953aa05)
## [0.6.0-alpha.0] - 2026-05-29

### Bug Fixes
- **spaces:** Use inclusive bounds in joinedAt timing test (f08e726)
- **auth,users:** Register SpaceContext in module providers (d4cd2c3)
- **auth,users:** Fix SpaceContext flow for register and login (b784c35)
- **app:** Import SpacesModule in AppModule to register CreateSpaceCommandHandler (99a2146)
- **e2e:** Add SpaceEntity and SpaceMembershipEntity to E2E bootstrap (7240e12)
- **e2e:** Pass X-Space-ID in protected requests, update auth API (ec9b2cd)
- **app,auth:** Replace global JwtAuthGuard with OptionalJwtAuthGuard, add @SkipSpace to public auth routes (fdbd3ac)
- **auth:** Fix handleRequest generic signature in OptionalJwtAuthGuard (9478d50)
- **auth:** Rewrite OptionalJwtAuthGuard to skip via Reflector instead of soft passport handling (989a228)
- **tenant-repo:** Handle string/number id in delete proxy (bfe2aed)
- **migrations:** Fold username and profile columns into InitialSchema (9f008bd)

### Chore
- Release v0.6.0-alpha.0 (2ffa360)

### Documentation
- **openspec:** Update config and skill registry with established conventions (6604370)
- **openspec:** Mark PR #86 as merged in delivery state (5b74a43)
- **openspec:** Note known E2E issues and update delivery state (f9b1809)
- **openspec:** Verify and archive multitenant change (7526a14)

### Features
- **migrations:** Add spaces and tenant isolation schema (33f9645)
- **spaces:** Add spaces bounded context — domain and application layers (b6996c0)
- **spaces:** Add assert space exists services (c568bc9)
- **spaces:** Add infrastructure layer and cross-cutting tenant utilities (1bdf667)
- **spaces:** Add SpaceGuard, SpaceInterceptor and SpacesModule (dd0d06a)
- **auth,users:** Adapt contexts for multitenant row-level isolation (7333c83)
- **e2e:** Add Phase 7 space isolation E2E tests (7124f09)
- **app:** Register SpaceGuard and SpaceInterceptor as global providers (8894244)

### Refactor
- **spaces:** Align domain and application to project conventions (056fd90)
- **spaces:** Use assert services in handlers instead of raw findById (3b2692d)
- **spaces:** Remove redundant @Inject on concrete assert service (4985922)
- **users:** Reorder imports and add TODO for value objects in IUser interface (7407a42)
- **spaces:** Extend SpaceNameValueObject from StringValueObject (7355a78)
- **spaces:** Address PR #86 review comments (0b3279f)
- **spaces:** Align SpacesModule with project module conventions (8a2cb7f)
- **spaces:** Remove all exports from SpacesModule (0c2712a)
- **shared:** Introduce global SharedModule for SpaceContext (4cbfda3)
## [0.5.5-alpha.0] - 2026-05-29

### Bug Fixes
- **docker:** Create logs dir with node ownership before switching user (1827141)

### Chore
- Release v0.5.5-alpha.0 (1e7aa7f)
## [0.5.4-alpha.0] - 2026-05-29

### Bug Fixes
- **docker:** Add prod-deps stage to include node_modules in runtime image (a4229c6)
- **docker:** Skip prepare script in prod-deps stage to avoid missing husky (238175a)
- **docker:** Prune devDeps from existing node_modules instead of reinstalling (c4cf5d3)
- **husky:** Skip prepare script when HUSKY=0 to support Docker prod builds (92d02e7)

### Chore
- Integrate OpenSpec spec-driven workflow (418e3ff)
- Release v0.5.4-alpha.0 (3a0a90a)
## [0.5.3-alpha.0] - 2026-05-29

### Chore
- Release v0.5.3-alpha.0 (76b8701)

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

