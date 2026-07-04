import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit';

import { PlantQueryableField } from '@contexts/plants/transport/graphql/enums/plant/plant-queryable-field.enum';

/**
 * `field` is typed to {@link PlantQueryableField} instead of a free string.
 * `createFilterInput` registers its returned class `{ isAbstract: true }`, so
 * this subclass needs its own `@InputType` to actually register a concrete
 * GraphQL type.
 */
@InputType('PlantFilterInput')
export class PlantFilterInput extends createFilterInput(
  PlantQueryableField,
  'Plant',
) {}
