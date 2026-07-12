import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

@ObjectType('NodeTelemetryReadingResponseDto')
export class NodeTelemetryReadingResponseDto {
  @Field(() => ID, { description: 'The id of the reading' })
  id!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => String, {
    description: 'UUID of the node that reported this reading',
  })
  nodeId!: string;

  @Field(() => String, { description: 'Sensor type' })
  sensorType!: string;

  @Field(() => Float, { description: 'Reading value' })
  value!: number;

  @Field(() => String, { nullable: true, description: 'Unit of measurement' })
  unit?: string | null;

  @Field(() => Date, { description: 'When the reading was taken' })
  recordedAt!: Date;
}

@ObjectType('PaginatedNodeTelemetryReadingResultDto')
export class PaginatedNodeTelemetryReadingResultDto extends BasePaginatedResultDto {
  @Field(() => [NodeTelemetryReadingResponseDto], {
    description: 'The telemetry readings in the current page',
  })
  items!: NodeTelemetryReadingResponseDto[];
}
