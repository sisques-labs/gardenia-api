import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import {
  PaginatedUserResultDto,
  UserResponseDto,
} from '@contexts/users/transport/graphql/dtos/responses/user/user.response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

@Injectable()
export class UserGraphQLMapper {
  private readonly logger = new Logger(UserGraphQLMapper.name);

  toResponseDtoFromViewModel(user: UserViewModel): UserResponseDto {
    this.logger.log(`Mapping user view model to response dto: ${user.id}`);

    return {
      id: user.id,
      status: user.status,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      locale: user.locale,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toPaginatedResponseDto(
    paginatedResult: PaginatedResult<UserViewModel>,
  ): PaginatedUserResultDto {
    return {
      items: paginatedResult.items.map((user) =>
        this.toResponseDtoFromViewModel(user),
      ),
      total: paginatedResult.total,
      page: paginatedResult.page,
      perPage: paginatedResult.perPage,
      totalPages: paginatedResult.totalPages,
    };
  }
}
