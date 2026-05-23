import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser, CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegisterUserCommand } from '@contexts/users/application/commands/register-user/register-user.command';
import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/i-user-read.repository';

import { RegisterUserDto } from './dtos/register-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterUserDto): Promise<void> {
    await this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password),
    );
  }

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
