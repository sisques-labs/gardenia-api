import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SensorReadingAggregate } from '@contexts/sensor-readings/domain/aggregates/sensor-reading.aggregate';
import { SensorReadingBuilder } from '@contexts/sensor-readings/domain/builders/sensor-reading.builder';
import { ISensorReadingWriteRepository } from '@contexts/sensor-readings/domain/repositories/write/sensor-reading-write.repository';

import { RecordSensorReadingCommand } from './record-sensor-reading.command';
import { RecordSensorReadingCommandHandler } from './record-sensor-reading.handler';

describe('RecordSensorReadingCommandHandler', () => {
  let repository: jest.Mocked<ISensorReadingWriteRepository>;
  let handler: RecordSensorReadingCommandHandler;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockImplementation((a: SensorReadingAggregate) => a),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ISensorReadingWriteRepository>;
    handler = new RecordSensorReadingCommandHandler(
      repository,
      new SensorReadingBuilder(),
    );
  });

  it('persists a reading and returns its id', async () => {
    const command = new RecordSensorReadingCommand({
      plantId: UuidValueObject.generate().value,
      spaceId: UuidValueObject.generate().value,
      metric: 'Moisture',
      value: 42.5,
      unit: '%',
      source: 'home_assistant',
    });

    const id = await handler.execute(command);

    expect(id).toEqual(expect.any(String));
    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = repository.save.mock.calls[0][0];
    // metric normalized to lower-case by the value object
    expect(saved.metric.value).toBe('moisture');
    expect(saved.value.value).toBe(42.5);
    expect(saved.unit.value).toBe('%');
  });
});
