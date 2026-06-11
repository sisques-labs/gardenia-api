import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { EnrichPlantSpeciesCommand } from '@contexts/plant-species/application/commands/enrich-plant-species/enrich-plant-species.command';
import { ImportPlantSpeciesCommand } from '@contexts/plant-species/application/commands/import-plant-species/import-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { PlantSpeciesCreateRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-create.request.dto';
import { PlantSpeciesDeleteRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-delete.request.dto';
import { PlantSpeciesEnrichRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-enrich.request.dto';
import { PlantSpeciesImportRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-import.request.dto';
import { PlantSpeciesUpdateRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-update.request.dto';
import { ImportPlantSpeciesResultResponseDto } from '@contexts/plant-species/transport/graphql/dtos/responses/import-plant-species-result.response.dto';

@Resolver()
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class PlantSpeciesMutationsResolver {
  private readonly logger = new Logger(PlantSpeciesMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  // TODO: restrict to admin
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
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species created successfully',
      id: plantSpeciesId,
    });
  }

  // TODO: restrict to admin
  @Mutation(() => MutationResponseDto)
  async updatePlantSpecies(
    @Args('input') input: PlantSpeciesUpdateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating plant species: ${input.id}`);

    await this.commandBus.execute(
      new UpdatePlantSpeciesCommand({
        id: input.id,
        scientificName: input.scientificName,
        description: input.description,
        imageUrl: input.imageUrl,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species updated successfully',
      id: input.id,
    });
  }

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

  // TODO: add admin auth guard
  @Mutation(() => MutationResponseDto)
  async enrichPlantSpecies(
    @Args('input') input: PlantSpeciesEnrichRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Enriching plant species: ${input.scientificName}`);

    const plantSpeciesId = await this.commandBus.execute<
      EnrichPlantSpeciesCommand,
      string | null
    >(
      new EnrichPlantSpeciesCommand({
        scientificName: input.scientificName,
      }),
    );

    if (!plantSpeciesId) {
      return this.mutationResponseGraphQLMapper.toResponseDto({
        success: true,
        message: 'No enrichment data found for the provided scientific name',
      });
    }

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant species enriched successfully',
      id: plantSpeciesId,
    });
  }

  // TODO: add admin auth guard
  @Mutation(() => ImportPlantSpeciesResultResponseDto)
  async importPlantSpecies(
    @Args('input') input: PlantSpeciesImportRequestDto,
  ): Promise<ImportPlantSpeciesResultResponseDto> {
    this.logger.log(
      `Importing plant species: limit=${input.limit}, offset=${input.offset}`,
    );

    return this.commandBus.execute(
      new ImportPlantSpeciesCommand({
        limit: input.limit,
        offset: input.offset,
      }),
    );
  }
}
