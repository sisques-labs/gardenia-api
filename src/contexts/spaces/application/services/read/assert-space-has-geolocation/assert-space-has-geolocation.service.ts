import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { SpaceHasNoGeolocationException } from '@contexts/spaces/domain/exceptions/space-has-no-geolocation.exception';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

@Injectable()
export class AssertSpaceHasGeolocationService implements IBaseService {
  execute(space: SpaceViewModel): void {
    if (space.latitude == null || space.longitude == null) {
      throw new SpaceHasNoGeolocationException(space.id);
    }
  }
}
