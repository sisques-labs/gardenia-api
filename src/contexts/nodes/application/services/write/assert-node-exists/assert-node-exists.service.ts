import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';
import { NodeNotFoundException } from '@contexts/nodes/domain/exceptions/node-not-found.exception';
import {
  NODE_WRITE_REPOSITORY,
  INodeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/node-write.repository';
import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

@Injectable()
export class AssertNodeExistsService implements IBaseService {
  constructor(
    @Inject(NODE_WRITE_REPOSITORY)
    private readonly nodeWriteRepository: INodeWriteRepository,
  ) {}

  async execute(id: NodeIdValueObject): Promise<NodeAggregate> {
    const node = await this.nodeWriteRepository.findById(id.value);
    if (!node) throw new NodeNotFoundException(id.value);

    return node;
  }
}
