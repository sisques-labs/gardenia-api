import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentEnum } from '../enums/space-environment.enum';
import { ISpacePrimitives } from '../primitives/space.primitives';

export class SpaceViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly ownerId: string;
  public readonly latitude: number | null;
  public readonly longitude: number | null;
  public readonly environment: SpaceEnvironmentEnum | null;

  constructor(props: ISpacePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.ownerId = props.ownerId;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.environment = props.environment;
  }
}
