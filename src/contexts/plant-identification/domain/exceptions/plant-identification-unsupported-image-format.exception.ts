import { BaseException } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationImageMimeTypeEnum } from '@contexts/plant-identification/domain/enums/plant-identification-image-mime-type.enum';

export class PlantIdentificationUnsupportedImageFormatException extends BaseException {
  constructor(mimeType: string) {
    super(
      `Unsupported image format "${mimeType}" for plant identification — accepted formats: ${Object.values(PlantIdentificationImageMimeTypeEnum).join(', ')}`,
    );
  }
}
