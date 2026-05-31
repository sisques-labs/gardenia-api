import { validate } from 'class-validator';
import { CreatePlantDto } from './create-plant.dto';

describe('CreatePlantDto', () => {
  it('passes with name only', async () => {
    const dto = new CreatePlantDto();
    dto.name = 'My Plant';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with name + plantSpeciesId + imageUrl', async () => {
    const dto = new CreatePlantDto();
    dto.name = 'Rose';
    dto.plantSpeciesId = '550e8400-e29b-41d4-a716-446655440003';
    dto.imageUrl = 'https://example.com/rose.jpg';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when name is empty', async () => {
    const dto = new CreatePlantDto();
    dto.name = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('fails when name is missing', async () => {
    const dto = new CreatePlantDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
