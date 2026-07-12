import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import { BridgeNotFoundException } from '@contexts/nodes/domain/exceptions/bridge-not-found.exception';
import {
  BRIDGE_WRITE_REPOSITORY,
  IBridgeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/bridge-write.repository';
import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';

@Injectable()
export class AssertBridgeExistsService implements IBaseService {
  constructor(
    @Inject(BRIDGE_WRITE_REPOSITORY)
    private readonly bridgeWriteRepository: IBridgeWriteRepository,
  ) {}

  async execute(id: BridgeIdValueObject): Promise<BridgeAggregate> {
    const bridge = await this.bridgeWriteRepository.findById(id.value);
    if (!bridge) throw new BridgeNotFoundException(id.value);

    return bridge;
  }
}
