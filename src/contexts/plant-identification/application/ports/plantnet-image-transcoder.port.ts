import { PlantNetIdentificationImageInput } from '@contexts/plant-identification/application/ports/plantnet-identification-image.input';

export const PLANTNET_IMAGE_TRANSCODER_PORT = Symbol(
  'PLANTNET_IMAGE_TRANSCODER_PORT',
);

/**
 * PlantNet's identify endpoint only accepts `image/jpeg` or `image/png`
 * (confirmed against a real HTTP 400 in production for an `image/webp`
 * upload — `files` allows webp generally, PlantNet does not). Implementers
 * transcode anything outside that pair to JPEG; images already in an
 * accepted format are returned unchanged.
 */
export interface IPlantNetImageTranscoderPort {
  ensureAcceptedFormat(
    image: PlantNetIdentificationImageInput,
  ): Promise<PlantNetIdentificationImageInput>;
}
