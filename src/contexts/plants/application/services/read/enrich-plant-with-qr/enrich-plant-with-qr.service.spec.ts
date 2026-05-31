import { IPlantQrPort } from '@contexts/plants/application/ports/plant-qr.port';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { EnrichPlantWithQrService } from './enrich-plant-with-qr.service';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const QR_ID = 'd4e5f6a7-b8c9-4123-def0-234567890123';
const TARGET_URL = 'https://gardenia.app/qr/d4e5f6a7';
const IMAGE = 'aGVsbG93b3JsZA==';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeQrData(): PlantQrViewModel {
  return new PlantQrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: TARGET_URL,
    generation: 1,
    image: IMAGE,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

function makePlantViewModel(qrId: string | null): PlantViewModel {
  return new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    plantSpeciesId: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('EnrichPlantWithQrService', () => {
  let service: EnrichPlantWithQrService;
  let qrPort: jest.Mocked<IPlantQrPort>;
  let plantBuilder: PlantBuilder;

  beforeEach(() => {
    qrPort = { findByQrId: jest.fn() };
    plantBuilder = new PlantBuilder();
    service = new EnrichPlantWithQrService(plantBuilder, qrPort);
  });

  it('enriches plant with qr object when port returns PlantQrData', async () => {
    const plant = makePlantViewModel(QR_ID);
    qrPort.findByQrId.mockResolvedValue(makeQrData());

    const result = await service.execute(plant);

    expect(result.qr).not.toBeNull();
    expect(result.qr!.id).toBe(QR_ID);
    expect(result.qr!.targetUrl).toBe(TARGET_URL);
    expect(result.qr!.image).toBe(IMAGE);
    expect(qrPort.findByQrId).toHaveBeenCalledWith(QR_ID);
  });

  it('returns plant unchanged when port returns null', async () => {
    const plant = makePlantViewModel(QR_ID);
    qrPort.findByQrId.mockResolvedValue(null);

    const result = await service.execute(plant);

    expect(result).toBe(plant);
    expect(result.qr).toBeNull();
  });

  it('returns plant unchanged and does not call port when qrId is null', async () => {
    const plant = makePlantViewModel(null);

    const result = await service.execute(plant);

    expect(result).toBe(plant);
    expect(qrPort.findByQrId).not.toHaveBeenCalled();
  });
});
