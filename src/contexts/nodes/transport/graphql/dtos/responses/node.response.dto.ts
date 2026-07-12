import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

@ObjectType('NodeResponseDto')
export class NodeResponseDto {
  @Field(() => ID, { description: 'The id of the node' })
  id!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => String, { description: 'UUID of the bridge relaying this node' })
  bridgeId!: string;

  @Field(() => String, { nullable: true, description: 'User-assigned label' })
  name?: string | null;

  @Field(() => String, { description: 'online | offline' })
  status!: string;

  @Field(() => Date, { nullable: true, description: 'Last heartbeat' })
  lastSeenAt?: Date | null;

  @Field(() => Date, { description: 'When the node was first seen' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the node was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedNodeResultDto')
export class PaginatedNodeResultDto extends BasePaginatedResultDto {
  @Field(() => [NodeResponseDto], {
    description: 'The nodes in the current page',
  })
  items!: NodeResponseDto[];
}
