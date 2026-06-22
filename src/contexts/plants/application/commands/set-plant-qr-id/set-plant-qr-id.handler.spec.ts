import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { AssertPlantExistsService } from '@contexts/plants/application/services/write/assert-plant-exists/assert-plant-exists.service';
import { SetPlantQrIdCommand } from './set-plant-qr-id.command';
import { SetPlantQrIdCommandHandler } from './set-plant-qr-id.handler';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const QR_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('SetPlantQrIdCommandHandler', () => {
  let handler: SetPlantQrIdCommandHandler;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;
  let assertPlantExistsService: jest.Mocked<AssertPlantExistsService>;
  let plant: jest.Mocked<PlantAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    plant = {
      linkQr: jest.fn(),
    } as unknown as jest.Mocked<PlantAggregate>;

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IPlantWriteRepository>;

    assertPlantExistsService = {
      execute: jest.fn().mockResolvedValue(plant),
    } as unknown as jest.Mocked<AssertPlantExistsService>;

    handler = new SetPlantQrIdCommandHandler(
      writeRepository,
      assertPlantExistsService,
    );
  });

  it('links the QR to the plant and saves it', async () => {
    await handler.execute(
      new SetPlantQrIdCommand({ plantId: PLANT_ID, qrId: QR_ID }),
    );

    expect(assertPlantExistsService.execute).toHaveBeenCalledTimes(1);
    expect(plant.linkQr).toHaveBeenCalledTimes(1);
    expect(plant.linkQr).toHaveBeenCalledWith(
      expect.objectContaining({ value: QR_ID }),
    );
    expect(writeRepository.save).toHaveBeenCalledWith(plant);
  });

  it('propagates when the plant does not exist', async () => {
    assertPlantExistsService.execute.mockRejectedValue(new Error('not found'));

    await expect(
      handler.execute(
        new SetPlantQrIdCommand({ plantId: PLANT_ID, qrId: QR_ID }),
      ),
    ).rejects.toThrow('not found');
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
