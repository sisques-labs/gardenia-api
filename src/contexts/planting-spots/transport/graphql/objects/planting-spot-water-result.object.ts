import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlantingSpotWaterFailureObject {
  @Field(() => String, {
    description: 'UUID of the plant that failed to be watered',
  })
  plantId!: string;

  @Field(() => String, { description: 'Reason the watering failed' })
  reason!: string;
}

@ObjectType()
export class PlantingSpotWaterResultObject {
  @Field(() => String, { description: 'UUID of the watered planting spot' })
  plantingSpotId!: string;

  @Field(() => [String], {
    description: 'UUIDs of the plants that were watered successfully',
  })
  wateredPlantIds!: string[];

  @Field(() => [PlantingSpotWaterFailureObject], {
    description: 'Plants that failed to be watered, with the failure reason',
  })
  failedPlants!: PlantingSpotWaterFailureObject[];
}
