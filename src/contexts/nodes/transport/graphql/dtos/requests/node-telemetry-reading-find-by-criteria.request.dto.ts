import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { NodeTelemetryReadingFilterInput } from '@contexts/nodes/transport/graphql/dtos/requests/node-telemetry-reading-filter.input';
import { NodeTelemetryReadingSortInput } from '@contexts/nodes/transport/graphql/dtos/requests/node-telemetry-reading-sort.input';

@InputType('NodeTelemetryReadingFindByCriteriaRequestDto')
export class NodeTelemetryReadingFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [NodeTelemetryReadingFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NodeTelemetryReadingFilterInput)
  declare filters?: NodeTelemetryReadingFilterInput[];

  @Field(() => [NodeTelemetryReadingSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NodeTelemetryReadingSortInput)
  declare sorts?: NodeTelemetryReadingSortInput[];
}
