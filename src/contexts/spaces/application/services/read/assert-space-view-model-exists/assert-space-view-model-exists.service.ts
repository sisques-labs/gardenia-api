import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

@Injectable()
export class AssertSpaceViewModelExistsService implements IBaseService {
  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<SpaceViewModel> {
    const space = await this.spaceReadRepository.findById(id.value);
    if (!space) throw new SpaceNotFoundException(id.value);

    return space;
  }
}
