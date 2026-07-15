import { Repository } from 'typeorm';

import { SpaceContext } from '../space-context/space-context.service';

export function createTenantRepository<E extends { spaceId: string }>(
  repo: Repository<E>,
  ctx: SpaceContext,
): Repository<E> {
  return new Proxy(repo, {
    get(target, prop) {
      if (prop === 'findOne' || prop === 'find' || prop === 'findAndCount') {
        return (options: any = {}) =>
          (target as any)[prop]({
            ...options,
            where: { ...options.where, spaceId: ctx.require() },
          });
      }
      if (prop === 'save') {
        return (entityOrEntities: any) => {
          const spaceId = ctx.require();
          const withSpaceId = Array.isArray(entityOrEntities)
            ? entityOrEntities.map((entity) => ({ ...entity, spaceId }))
            : { ...entityOrEntities, spaceId };
          return target.save(withSpaceId);
        };
      }
      if (prop === 'delete') {
        return (criteria: any) => {
          const where =
            typeof criteria === 'string' || typeof criteria === 'number'
              ? { id: criteria, spaceId: ctx.require() }
              : { ...criteria, spaceId: ctx.require() };
          return target.delete(where);
        };
      }
      return Reflect.get(target, prop);
    },
  });
}
