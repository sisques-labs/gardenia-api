import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

@ObjectType('BridgeResponseDto')
export class BridgeResponseDto {
  @Field(() => ID, { description: 'The id of the bridge' })
  id!: string;

  @Field(() => String, {
    nullable: true,
    description: 'UUID of the space this bridge is claimed into',
  })
  spaceId?: string | null;

  @Field(() => String, { nullable: true, description: 'User-assigned label' })
  name?: string | null;

  @Field(() => String, { description: 'unclaimed | active | offline' })
  status!: string;

  @Field(() => Date, { nullable: true, description: 'Last health ping' })
  lastSeenAt?: Date | null;

  @Field(() => Date, { description: 'When the bridge was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the bridge was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedBridgeResultDto')
export class PaginatedBridgeResultDto extends BasePaginatedResultDto {
  @Field(() => [BridgeResponseDto], {
    description: 'The bridges in the current page',
  })
  items!: BridgeResponseDto[];
}
