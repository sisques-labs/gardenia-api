import { PlantNetApiKeyMissingException } from './plantnet-api-key-missing.exception';

describe('PlantNetApiKeyMissingException', () => {
  it('carries a fixed, descriptive message', () => {
    const exception = new PlantNetApiKeyMissingException();

    expect(exception.message).toBe(
      'PLANTNET_API_KEY is required for the plant-identification context',
    );
  });
});
