import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { UserFindByIdQuery } from '@contexts/users/application/queries/user-find-by-id/user-find-by-id.query';
import { UserFindByCriteriaRequestDto } from '@contexts/users/transport/graphql/dtos/requests/user/user-find-by-criteria.request.dto';
import { UserFindByIdRequestDto } from '@contexts/users/transport/graphql/dtos/requests/user/user-find-by-id.request.dto';
import {
  PaginatedUserResultDto,
  UserResponseDto,
} from '@contexts/users/transport/graphql/dtos/responses/user/user.response.dto';
import { UserGraphQLMapper } from '@contexts/users/transport/graphql/mappers/user/user.mapper';
import { userFilterableFields } from '@contexts/users/transport/graphql/registries/user-filterable-fields.registry';
import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

@Resolver()
//@UseGuards(JwtAuthGuard)
export class UserQueriesResolver {
  private readonly logger = new Logger(UserQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly userGraphQLMapper: UserGraphQLMapper,
  ) {}

  @Query(() => PaginatedUserResultDto)
  async usersFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(userFilterableFields),
    )
    input?: UserFindByCriteriaRequestDto,
  ): Promise<PaginatedUserResultDto> {
    this.logger.log(`Finding users by criteria: ${JSON.stringify(input)}`);

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new UserFindByCriteriaQuery({ criteria }),
    );

    return this.userGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => UserResponseDto, { nullable: true })
  async userFindById(
    @Args('input') input: UserFindByIdRequestDto,
  ): Promise<UserResponseDto | null> {
    this.logger.log(`Finding user by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new UserFindByIdQuery({ id: input.id }),
    );

    return result
      ? this.userGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }
}
