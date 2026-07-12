import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { NodeNotFoundException } from '@contexts/nodes/domain/exceptions/node-not-found.exception';
import {
  NODE_READ_REPOSITORY,
  INodeReadRepository,
} from '@contexts/nodes/domain/repositories/read/node-read.repository';
import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';
import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';

@Injectable()
export class AssertNodeViewModelExistsService implements IBaseService {
  constructor(
    @Inject(NODE_READ_REPOSITORY)
    private readonly nodeReadRepository: INodeReadRepository,
  ) {}

  async execute(id: NodeIdValueObject): Promise<NodeViewModel> {
    const node = await this.nodeReadRepository.findById(id.value);
    if (!node) throw new NodeNotFoundException(id.value);

    return node;
  }
}
