import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';

export const NODE_READ_REPOSITORY = Symbol('NODE_READ_REPOSITORY');

export type INodeReadRepository = IBaseReadRepository<NodeViewModel>;
