import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Sends a GraphQL request to the running app.
 *
 * @param app    - The bootstrapped NestJS application
 * @param query  - GraphQL operation string (query or mutation)
 * @param variables - Optional variables map
 * @param token  - Optional Bearer token for authenticated requests
 */
export function gql(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): request.Test {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables: variables ?? {} });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
}
