import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantFromIdentificationCommand } from '@contexts/plant-identification/application/commands/create-plant-from-identification/create-plant-from-identification.command';
import { CreatedPlantPortResult } from '@contexts/plant-identification/application/ports/created-plant-port.result';
import { CreatePlantFromIdentificationRequestDto } from '@contexts/plant-identification/transport/graphql/dtos/requests/create-plant-from-identification.request.dto';
import { CreatedPlantFromIdentificationObject } from '@contexts/plant-identification/transport/graphql/objects/created-plant-from-identification.object';

@UseGuards(JwtAuthGuard)
@Resolver()
export class PlantIdentificationMutationsResolver {
  private readonly logger = new Logger(
    PlantIdentificationMutationsResolver.name,
  );

  constructor(private readonly commandBus: CommandBus) {}

  @Mutation(() => CreatedPlantFromIdentificationObject)
  async createPlantFromIdentification(
    @Args('input') input: CreatePlantFromIdentificationRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CreatedPlantFromIdentificationObject> {
    this.logger.log(
      `Creating plant from identification ${input.identificationId} for user: ${user.userId}`,
    );

    const result = await this.commandBus.execute<
      CreatePlantFromIdentificationCommand,
      CreatedPlantPortResult
    >(
      new CreatePlantFromIdentificationCommand({
        identificationId: input.identificationId,
        name: input.name,
        imageUrl: input.imageUrl ?? null,
        requestingUserId: user.userId,
      }),
    );

    return result;
  }
}
