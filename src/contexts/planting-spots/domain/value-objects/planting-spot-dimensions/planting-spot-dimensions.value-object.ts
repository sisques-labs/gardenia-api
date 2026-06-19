export interface IPlantingSpotDimensionsProps {
  width?: number | null;
  height?: number | null;
  length?: number | null;
}

export class PlantingSpotDimensionsValueObject {
  public readonly width: number | null;
  public readonly height: number | null;
  public readonly length: number | null;

  constructor(props: IPlantingSpotDimensionsProps = {}) {
    this.width = props.width ?? null;
    this.height = props.height ?? null;
    this.length = props.length ?? null;
  }
}
