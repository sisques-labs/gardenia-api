import { SpaceHasNoGeolocationException } from '@contexts/spaces/domain/exceptions/space-has-no-geolocation.exception';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { AssertSpaceHasGeolocationService } from './assert-space-has-geolocation.service';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('AssertSpaceHasGeolocationService', () => {
  let service: AssertSpaceHasGeolocationService;

  beforeEach(() => {
    service = new AssertSpaceHasGeolocationService();
  });

  it('resolves when both latitude and longitude are present', async () => {
    const space = {
      id: SPACE_ID,
      latitude: 40.4168,
      longitude: -3.7038,
    } as SpaceViewModel;

    await expect(service.execute(space)).resolves.toBeUndefined();
  });

  it('throws when latitude is null', async () => {
    const space = {
      id: SPACE_ID,
      latitude: null,
      longitude: -3.7038,
    } as unknown as SpaceViewModel;

    await expect(service.execute(space)).rejects.toThrow(
      SpaceHasNoGeolocationException,
    );
  });

  it('throws when longitude is null', async () => {
    const space = {
      id: SPACE_ID,
      latitude: 40.4168,
      longitude: null,
    } as unknown as SpaceViewModel;

    await expect(service.execute(space)).rejects.toThrow(
      SpaceHasNoGeolocationException,
    );
  });
});
