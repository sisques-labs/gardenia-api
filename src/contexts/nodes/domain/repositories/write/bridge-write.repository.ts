import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';

export const BRIDGE_WRITE_REPOSITORY = Symbol('BRIDGE_WRITE_REPOSITORY');

export type IBridgeWriteRepository = IBaseWriteRepository<BridgeAggregate>;
