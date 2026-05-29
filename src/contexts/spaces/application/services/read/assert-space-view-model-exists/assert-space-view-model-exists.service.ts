import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

@Injectable()
export class AssertSpaceViewModelExistsService implements IBaseService {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(id: SpaceIdValueObject): Promise<SpaceViewModel> {
    const space = await this.spaceReadRepository.findById(id.value);
    if (!space) throw new SpaceNotFoundException(id.value);

    return space;
  }
}
