import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

@ObjectType('HarvestResponseDto')
export class HarvestResponseDto {
  @Field(() => ID, { description: 'UUID of the harvest' })
  id!: string;

  @Field(() => String, { description: 'Crop type (free text)' })
  cropType!: string;

  @Field(() => Number, { description: 'Quantity harvested' })
  quantity!: number;

  @Field(() => HarvestUnitEnum, { description: 'Unit of measurement' })
  unit!: HarvestUnitEnum;

  @Field(() => Date, { description: 'When the harvest occurred' })
  harvestedAt!: Date;

  @Field(() => String, { description: 'UUID of the recorder' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the record was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedHarvestResultDto')
export class PaginatedHarvestResultDto extends BasePaginatedResultDto {
  @Field(() => [HarvestResponseDto], {
    description: 'Harvests in the current page',
  })
  items!: HarvestResponseDto[];
}
