import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IQrPrimitives } from '../primitives/qr.primitives';

export class QrViewModel extends BaseViewModel {
  public readonly plantId: string;
  public readonly spaceId: string;
  public readonly targetUrl: string;
  public readonly generation: number;

  constructor(props: IQrPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.plantId = props.plantId;
    this.spaceId = props.spaceId;
    this.targetUrl = props.targetUrl;
    this.generation = props.generation;
  }
}
