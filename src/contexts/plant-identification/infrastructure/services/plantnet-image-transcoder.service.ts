import { Injectable, Logger } from '@nestjs/common';
import { MimeTypeValueObject } from '@sisques-labs/nestjs-kit';
import type { Sharp } from 'sharp';

import { IPlantNetImageTranscoderPort } from '@contexts/plant-identification/application/ports/plantnet-image-transcoder.port';
import { PlantNetIdentificationImageInput } from '@contexts/plant-identification/application/ports/plantnet-identification-image.input';

// sharp's package.json "exports" map isn't resolved under this repo's
// (Node10/classic) TS moduleResolution, which picks its ESM .d.mts types
// for a CJS default import — require it directly, matching the established
// pattern for other CJS libraries without matching type resolution here
// (see apple-oauth.strategy.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp: (input: Buffer) => Sharp = require('sharp');

const PLANTNET_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];
const TRANSCODED_MIME_TYPE = new MimeTypeValueObject('image/jpeg');

@Injectable()
export class PlantNetImageTranscoderService implements IPlantNetImageTranscoderPort {
  private readonly logger = new Logger(PlantNetImageTranscoderService.name);

  async ensureAcceptedFormat(
    image: PlantNetIdentificationImageInput,
  ): Promise<PlantNetIdentificationImageInput> {
    if (PLANTNET_ACCEPTED_MIME_TYPES.includes(image.mimeType.value)) {
      return image;
    }

    this.logger.log(
      `Transcoding image from ${image.mimeType.value} to image/jpeg for PlantNet`,
    );
    const content = await sharp(image.content).jpeg().toBuffer();
    this.logger.log(`Transcoded image to image/jpeg (${content.length} bytes)`);

    return { ...image, content, mimeType: TRANSCODED_MIME_TYPE };
  }
}
