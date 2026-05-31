import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrFindByIdRequestDto } from '@contexts/qr/transport/graphql/dtos/requests/qr/qr-find-by-id.request.dto';
import { QrResponseDto } from '@contexts/qr/transport/graphql/dtos/responses/qr/qr.response.dto';
import { QrGraphQLMapper } from '@contexts/qr/transport/graphql/mappers/qr/qr.mapper';

@Resolver()
export class QrQueriesResolver {
  private readonly logger = new Logger(QrQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly qrGraphQLMapper: QrGraphQLMapper,
  ) {}

  @Query(() => QrResponseDto)
  @UseGuards(JwtAuthGuard)
  async qrFindById(
    @Args('input') input: QrFindByIdRequestDto,
  ): Promise<QrResponseDto> {
    this.logger.log(`Finding QR by id: ${input.id}`);

    const result = await this.queryBus.execute<QrFindByIdQuery, QrViewModel>(
      new QrFindByIdQuery({ qrId: input.id }),
    );

    return this.qrGraphQLMapper.toResponseDtoFromViewModel(result);
  }
}
