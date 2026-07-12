import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';

export const NODE_WRITE_REPOSITORY = Symbol('NODE_WRITE_REPOSITORY');

export type INodeWriteRepository = IBaseWriteRepository<NodeAggregate>;
