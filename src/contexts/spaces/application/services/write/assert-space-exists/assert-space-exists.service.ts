import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

@Injectable()
export class AssertSpaceExistsService implements IBaseService {
  constructor(
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<SpaceAggregate> {
    const space = await this.spaceWriteRepository.findById(id.value);
    if (!space) throw new SpaceNotFoundException(id.value);

    return space;
  }
}
