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
        return (entity: any) =>
          target.save({ ...entity, spaceId: ctx.require() });
      }
      if (prop === 'delete') {
        return (criteria: any) =>
          target.delete({ ...criteria, spaceId: ctx.require() });
      }
      return Reflect.get(target, prop);
    },
  });
}
