export type ApiTokenAuthenticateQueryInput = {
  /** Raw token exactly as received in the `Authorization` header. */
  rawToken: string;
};

/**
 * Resolves a raw API token to its owner + scoped space, or null. Used by the
 * auth guard; the raw token is never logged or echoed back.
 */
export class ApiTokenAuthenticateQuery {
  public readonly rawToken: string;

  constructor(input: ApiTokenAuthenticateQueryInput) {
    this.rawToken = input.rawToken;
  }
}
