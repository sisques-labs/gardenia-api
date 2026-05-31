import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import {
  PlantSpeciesCreateRequestDto,
  PlantSpeciesDeleteRequestDto,
  PlantSpeciesUpdateRequestDto,
} from '../dtos/requests/plant-species-mutation.request.dto';
import { PlantSpeciesResponseDto } from '../dtos/responses/plant-species.response.dto';
import { PlantSpeciesGraphQLMapper } from '../mappers/plant-species.mapper';

@Resolver()
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class PlantSpeciesMutationsResolver {
  private readonly logger = new Logger(PlantSpeciesMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly plantSpeciesGraphQLMapper: PlantSpeciesGraphQLMapper,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => PlantSpeciesResponseDto)
  async createPlantSpecies(
    @Args('input') input: PlantSpeciesCreateRequestDto,
  ): Promise<PlantSpeciesResponseDto> {
    this.logger.log(`Creating plant species: ${input.name}`);

    const plantSpeciesId = await this.commandBus.execute<
      CreatePlantSpeciesCommand,
      string
    >(new CreatePlantSpeciesCommand({ name: input.name }));

    const vm = await this.queryBus.execute<
      PlantSpeciesFindByIdQuery,
      PlantSpeciesViewModel
    >(new PlantSpeciesFindByIdQuery({ plantSpeciesId }));

    return this.plantSpeciesGraphQLMapper.toResponseDtoFromViewModel(vm);
  }

  @Mutation(() => PlantSpeciesResponseDto)
  async updatePlantSpecies(
    @Args('input') input: PlantSpeciesUpdateRequestDto,
  ): Promise<PlantSpeciesResponseDto> {
    this.logger.log(`Updating plant species: ${input.id}`);

    await this.commandBus.execute(
      new UpdatePlantSpeciesCommand({ id: input.id, name: input.name }),
    );

    const vm = await this.queryBus.execute<
      PlantSpeciesFindByIdQuery,
      PlantSpeciesViewModel
    >(new PlantSpeciesFindByIdQuery({ plantSpeciesId: input.id }));

    return this.plantSpeciesGraphQLMapper.toResponseDtoFromViewModel(vm);
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
}
