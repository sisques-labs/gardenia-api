import { Field, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType('NodeSendCommandRequestDto')
export class NodeSendCommandRequestDto {
  @Field(() => String, { description: 'The id of the target node' })
  @IsUUID()
  @IsNotEmpty()
  nodeId!: string;

  @Field(() => String, {
    description: 'Opaque command type understood by the node',
  })
  @IsString()
  @IsNotEmpty()
  commandType!: string;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Opaque command payload',
  })
  @IsOptional()
  payload?: unknown;
}
