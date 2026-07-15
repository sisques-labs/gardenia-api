import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';

export interface PlantNetIdentificationImageInput {
  content: Buffer;
  mimeType: string;
  organ: PlantIdentificationOrganEnum;
}
