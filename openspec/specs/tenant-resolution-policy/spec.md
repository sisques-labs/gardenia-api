# Tenant Resolution Policy Specification

## Purpose

Defines the single, mechanism-agnostic rule for resolving a request's current tenant/space, independent of authentication mechanism or token issuer. This policy binds gardenia's own auth mechanism today and any future external-identity/token integration (e.g., a later, separately-scoped Sisques Account migration).

## Requirements

### Requirement: Current Tenant Resolved Only From Header Plus Membership Lookup

The system MUST resolve the current tenant/space for any request ONLY from a tenant-identifying header (currently `X-Space-ID`, generalizable to `X-Tenant-ID`) combined with a database membership lookup. No claim inside any JWT, from any issuer, MUST ever act as or substitute for this selector. A JWT MAY carry a list of tenant/space memberships as identity-only metadata; such a list MUST NOT be interpreted as selecting a current tenant.

#### Scenario: Header present resolves the tenant

- GIVEN a request carries a valid `X-Space-ID` header
- WHEN the request is processed
- THEN the current tenant MUST be the space identified by the header, confirmed by a database membership lookup

#### Scenario: Token claim ignored, header required

- GIVEN a JWT (any issuer) carries a `spaceId`, `tenantId`, or membership-list claim, with or without an `X-Space-ID` header
- WHEN the current tenant is resolved
- THEN the JWT claim MUST be ignored
- AND a missing header MUST cause rejection rather than falling back to the claim

### Requirement: Policy Binds Future External-Identity Integrations

Any future integration that accepts or verifies a token from an external identity provider (e.g., a deferred Sisques Account migration) MUST comply with this policy. A proposal that would derive the current tenant from a token claim MUST be rejected as non-compliant unless it explicitly proposes to supersede this spec.

#### Scenario: Future integration proposal attempts claim-based tenant selection

- GIVEN a future change proposes deriving the current tenant from an externally-issued JWT claim
- WHEN that proposal is evaluated against this policy
- THEN it MUST be rejected as non-compliant unless it explicitly proposes to supersede this requirement
