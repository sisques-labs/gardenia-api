import { Field, Float, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';

@InputType('SpaceUpdateGeolocationRequestDto')
export class SpaceUpdateGeolocationRequestDto {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Field(() => SpaceEnvironmentEnum, { nullable: true })
  @IsOptional()
  @IsEnum(SpaceEnvironmentEnum)
  environment?: SpaceEnvironmentEnum;
}
