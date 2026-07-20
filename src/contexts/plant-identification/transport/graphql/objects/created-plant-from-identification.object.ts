import { Field, ObjectType } from '@nestjs/graphql';

/**
 * `createPlantFromIdentification`'s response only carries the new plant's
 * id (design.md: "Response: `{ id: plantId }` — caller only needs the id").
 * A dedicated `ObjectType` rather than `MutationResponseDto` because the
 * caller needs the created plant's id specifically, not an
 * ack-with-optional-id shape.
 */
@ObjectType('CreatedPlantFromIdentificationObject')
export class CreatedPlantFromIdentificationObject {
  @Field(() => String, { description: 'UUID of the newly created plant' })
  id!: string;
}
