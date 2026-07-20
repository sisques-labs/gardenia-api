import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantFromIdentificationCommand } from '@contexts/plant-identification/application/commands/create-plant-from-identification/create-plant-from-identification.command';
import { PlantIdentificationMutationsResolver } from './plant-identification-mutations.resolver';

const IDENTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';

describe('PlantIdentificationMutationsResolver', () => {
  let resolver: PlantIdentificationMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    resolver = new PlantIdentificationMutationsResolver(commandBus);
  });

  it('createPlantFromIdentification() dispatches the command and returns { id }', async () => {
    commandBus.execute.mockResolvedValue({ id: PLANT_ID });

    const result = await resolver.createPlantFromIdentification(
      { identificationId: IDENTIFICATION_ID, name: 'My Monstera' },
      { userId: USER_ID, email: 'user@example.com' } as never,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantFromIdentificationCommand),
    );
    expect(result).toEqual({ id: PLANT_ID });
  });
});
