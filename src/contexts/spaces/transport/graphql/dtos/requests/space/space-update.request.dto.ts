import { Field, Float, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import { SpaceNameValueObject } from '@contexts/spaces/domain/value-objects/space-name/space-name.value-object';

@InputType('SpaceUpdateRequestDto')
export class SpaceUpdateRequestDto {
  @Field(() => String)
  @IsUUID()
  spaceId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(SpaceNameValueObject.MAX_LENGTH)
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(SpaceEnvironmentEnum)
  environment?: string | null;
}
