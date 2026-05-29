import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ISpacePrimitives } from '../primitives/space.primitives';

export class SpaceViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly ownerId: string;

  constructor(props: ISpacePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.ownerId = props.ownerId;
  }
}
