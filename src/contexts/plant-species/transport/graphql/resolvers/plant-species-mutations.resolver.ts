import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { AppRoleGuard } from '@contexts/auth/infrastructure/guards/app-role.guard';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { RequireAppRole } from '@shared/decorators/require-app-role.decorator';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { PlantSpeciesCreateRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-create.request.dto';
import { PlantSpeciesDeleteRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-delete.request.dto';
import { PlantSpeciesUpdateRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-update.request.dto';

@Resolver()
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class PlantSpeciesMutationsResolver {
  private readonly logger = new Logger(PlantSpeciesMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @UseGuards(AppRoleGuard)
  @RequireAppRole(AppRoleEnum.ADMIN)
  @Mutation(() => MutationResponseDto)
  async createPlantSpecies(
    @Args('input') input: PlantSpeciesCreateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating plant species: ${input.scientificName}`);

    const plantSpeciesId = await this.commandBus.execute<
      CreatePlantSpeciesCommand,
      string
    >(
      new CreatePlantSpeciesCommand({
        scientificName: input.scientificName,
        gbifKey: input.gbifKey,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species created successfully',
      id: plantSpeciesId,
    });
  }

  @UseGuards(AppRoleGuard)
  @RequireAppRole(AppRoleEnum.ADMIN)
  @Mutation(() => MutationResponseDto)
  async updatePlantSpecies(
    @Args('input') input: PlantSpeciesUpdateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating plant species: ${input.id}`);

    await this.commandBus.execute(
      new UpdatePlantSpeciesCommand({
        id: input.id,
        scientificName: input.scientificName,
        gbifKey: input.gbifKey,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species updated successfully',
      id: input.id,
    });
  }

  @UseGuards(AppRoleGuard)
  @RequireAppRole(AppRoleEnum.ADMIN)
  @Mutation(() => MutationResponseDto)
  async deletePlantSpecies(
    @Args('input') input: PlantSpeciesDeleteRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting plant species: ${input.id}`);

    await this.commandBus.execute(
      new DeletePlantSpeciesCommand({ id: input.id }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species deleted successfully',
      id: input.id,
    });
  }
}
