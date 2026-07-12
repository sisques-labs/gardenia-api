import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';

export const BRIDGE_READ_REPOSITORY = Symbol('BRIDGE_READ_REPOSITORY');

export type IBridgeReadRepository = IBaseReadRepository<BridgeViewModel>;
