import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { BridgeNotFoundException } from '@contexts/nodes/domain/exceptions/bridge-not-found.exception';
import {
  BRIDGE_READ_REPOSITORY,
  IBridgeReadRepository,
} from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';

@Injectable()
export class AssertBridgeViewModelExistsService implements IBaseService {
  constructor(
    @Inject(BRIDGE_READ_REPOSITORY)
    private readonly bridgeReadRepository: IBridgeReadRepository,
  ) {}

  async execute(id: BridgeIdValueObject): Promise<BridgeViewModel> {
    const bridge = await this.bridgeReadRepository.findById(id.value);
    if (!bridge) throw new BridgeNotFoundException(id.value);

    return bridge;
  }
}
