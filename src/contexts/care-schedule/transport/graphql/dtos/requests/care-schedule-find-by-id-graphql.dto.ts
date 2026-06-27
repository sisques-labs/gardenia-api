import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('CareScheduleFindByIdInput')
export class CareScheduleFindByIdGraphQLDto {
  @Field(() => String, { description: 'UUID of the care schedule' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
