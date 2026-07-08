import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { DeletePlantPhotoCommand } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.command';
import { PlantPhotoDeleteRequestDto } from '@contexts/plant-photos/transport/graphql/dtos/requests/plant-photo-delete.request.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class PlantPhotoMutationsResolver {
  private readonly logger = new Logger(PlantPhotoMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async plantPhotoDelete(
    @Args('input') input: PlantPhotoDeleteRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting plant photo ${input.id}`);

    await this.commandBus.execute(
      new DeletePlantPhotoCommand({
        id: input.id,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant photo deleted successfully',
      id: input.id,
    });
  }
}
