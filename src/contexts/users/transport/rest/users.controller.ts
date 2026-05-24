import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/read/user-read.repository';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async me(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserViewModel | null> {
    return this.queryBus.execute<GetCurrentUserQuery, UserViewModel | null>(
      new GetCurrentUserQuery(user.userId),
    );
  }
}
