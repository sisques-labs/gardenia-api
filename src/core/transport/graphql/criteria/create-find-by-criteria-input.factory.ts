import { Type } from '@nestjs/common';
import { Field, InputType } from '@nestjs/graphql';
import {
  BaseFindByCriteriaInput,
  BasePaginationInput,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Type as TransformType } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * Options for {@link createFindByCriteriaInput}.
 *
 * `filterFieldEnum` / `sortFieldEnum` are the per-bounded-context enums whose
 * values MUST be the ViewModel field names. They must already be registered with
 * GraphQL via `registerEnumType` in the context's `*-registered-enums.graphql.ts`.
 */
export interface CreateFindByCriteriaInputOptions {
  /** PascalCase context name, e.g. `'User'`. Used to derive unique GraphQL type names. */
  name: string;
  /** Enum of filterable ViewModel fields, e.g. `UserFilterFieldEnum`. */
  filterFieldEnum: object;
  /** Enum of sortable ViewModel fields, e.g. `UserSortFieldEnum`. */
  sortFieldEnum: object;
}

/**
 * Builds a GraphQL `@InputType` for `findByCriteria` whose `filters[].field` and
 * `sorts[].field` are constrained to the supplied per-context enums instead of free
 * strings. Mirrors the kit's `BaseFilterInput` / `BaseSortInput` / `BaseFindByCriteriaInput`
 * (same property names, operators, pagination and defaults) so the resolver's
 * `new Criteria(input.filters, input.sorts, input.pagination)` and everything downstream
 * are unchanged — enum values are strings.
 *
 * @example
 * export class UserFindByCriteriaRequestDto extends createFindByCriteriaInput({
 *   name: 'User',
 *   filterFieldEnum: UserFilterFieldEnum,
 *   sortFieldEnum: UserSortFieldEnum,
 * }) {}
 */
export function createFindByCriteriaInput(
  options: CreateFindByCriteriaInputOptions,
): Type<BaseFindByCriteriaInput> {
  const { name, filterFieldEnum, sortFieldEnum } = options;

  @InputType(`${name}FilterInput`)
  class TypedFilterInput {
    @Field(() => filterFieldEnum, { description: 'The field to filter by' })
    @IsEnum(filterFieldEnum)
    @IsNotEmpty()
    field!: string;

    @Field(() => FilterOperator, { description: 'The operator to filter by' })
    @IsEnum(FilterOperator)
    @IsNotEmpty()
    operator!: FilterOperator;

    @Field(() => String, { description: 'The value to filter by' })
    @IsString()
    @IsNotEmpty()
    value!: string;
  }

  @InputType(`${name}SortInput`)
  class TypedSortInput {
    @Field(() => sortFieldEnum, { description: 'The field to sort by' })
    @IsEnum(sortFieldEnum)
    @IsNotEmpty()
    field!: string;

    @Field(() => SortDirection, { description: 'The direction to sort by' })
    @IsEnum(SortDirection)
    @IsNotEmpty()
    direction!: SortDirection;
  }

  @InputType(`${name}FindByCriteriaInput`)
  class TypedFindByCriteriaInput implements BaseFindByCriteriaInput {
    @Field(() => [TypedFilterInput], {
      nullable: true,
      description: 'The filters to find by',
      defaultValue: [],
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @TransformType(() => TypedFilterInput)
    filters?: TypedFilterInput[];

    @Field(() => [TypedSortInput], {
      nullable: true,
      description: 'The sorts to find by',
      defaultValue: [],
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @TransformType(() => TypedSortInput)
    sorts?: TypedSortInput[];

    @Field(() => BasePaginationInput, {
      nullable: true,
      description: 'The pagination to find by',
      defaultValue: { page: 1, perPage: 10 },
    })
    @IsOptional()
    @ValidateNested()
    @TransformType(() => BasePaginationInput)
    pagination?: BasePaginationInput;
  }

  return TypedFindByCriteriaInput;
}
