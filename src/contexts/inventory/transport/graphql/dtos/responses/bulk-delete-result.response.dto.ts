import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('BulkDeleteResultDto')
export class BulkDeleteResultDto {
  @Field(() => [ID], { description: 'Ids that were deleted' })
  deletedIds!: string[];

  @Field(() => [ID], {
    description:
      'Ids that were not found or did not belong to the active space',
  })
  notFoundIds!: string[];

  @Field(() => Int, { description: 'Number of items actually deleted' })
  deletedCount!: number;

  @Field(() => Int, { description: 'Number of unique ids requested' })
  requestedCount!: number;
}
