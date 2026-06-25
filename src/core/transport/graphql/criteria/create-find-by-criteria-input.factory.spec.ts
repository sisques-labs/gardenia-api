import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  Args,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { printSchema } from 'graphql';

// Registers FilterOperator + SortDirection enums used by the generated inputs.
import '@core/transport/graphql/registered-enums.graphql';
import { createFindByCriteriaInput } from './create-find-by-criteria-input.factory';

enum SampleFilterFieldEnum {
  STATUS = 'status',
  NAME = 'name',
}

enum SampleSortFieldEnum {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

registerEnumType(SampleFilterFieldEnum, { name: 'SampleFilterFieldEnum' });
registerEnumType(SampleSortFieldEnum, { name: 'SampleSortFieldEnum' });

@InputType('SampleFindByCriteriaRequestDto')
class SampleFindByCriteriaInput extends createFindByCriteriaInput({
  name: 'Sample',
  filterFieldEnum: SampleFilterFieldEnum,
  sortFieldEnum: SampleSortFieldEnum,
}) {}

@Resolver()
class SampleResolver {
  @Query(() => String)
  sample(
    @Args('input', { nullable: true }) _input?: SampleFindByCriteriaInput,
  ): string {
    return 'ok';
  }
}

describe('createFindByCriteriaInput', () => {
  it('returns a class exposing filters, sorts and pagination', () => {
    const instance = new SampleFindByCriteriaInput();

    expect(instance).toHaveProperty('filters');
    expect(instance).toHaveProperty('sorts');
    expect(instance).toHaveProperty('pagination');
  });

  it('produces distinct GraphQL type names per "name"', () => {
    const a = createFindByCriteriaInput({
      name: 'Alpha',
      filterFieldEnum: SampleFilterFieldEnum,
      sortFieldEnum: SampleSortFieldEnum,
    });
    const b = createFindByCriteriaInput({
      name: 'Beta',
      filterFieldEnum: SampleFilterFieldEnum,
      sortFieldEnum: SampleSortFieldEnum,
    });

    expect(a).not.toBe(b);
  });

  describe('generated GraphQL schema', () => {
    let appContext: INestApplicationContext;
    let sdl: string;

    beforeAll(async () => {
      appContext = await NestFactory.create(GraphQLSchemaBuilderModule, {
        logger: false,
      });
      await appContext.init();
      const schemaFactory = appContext.get(GraphQLSchemaFactory);
      const schema = await schemaFactory.create([SampleResolver]);
      sdl = printSchema(schema);
    });

    afterAll(async () => {
      await appContext.close();
    });

    it('types filter and sort fields to the supplied enums', () => {
      // The filter/sort `field` is the enum, not a free String.
      expect(sdl).toContain('input SampleFilterInput');
      expect(sdl).toMatch(/field: SampleFilterFieldEnum!/);
      expect(sdl).toContain('input SampleSortInput');
      expect(sdl).toMatch(/field: SampleSortFieldEnum!/);
    });

    it('registers the field enums in the schema', () => {
      expect(sdl).toContain('enum SampleFilterFieldEnum');
      expect(sdl).toContain('enum SampleSortFieldEnum');
    });

    it('keeps operator, direction and pagination from the kit', () => {
      expect(sdl).toMatch(/operator: FilterOperator!/);
      expect(sdl).toMatch(/direction: SortDirection!/);
      expect(sdl).toContain('pagination: BasePaginationInput');
    });
  });
});
