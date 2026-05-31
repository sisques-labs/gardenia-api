import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindPngByIdQuery } from '@contexts/qr/application/queries/qr-find-png-by-id/qr-find-png-by-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrRestResponseDto } from '@contexts/qr/transport/rest/dtos/qr-rest-response.dto';
import { QrRestMapper } from '@contexts/qr/transport/rest/mappers/qr/qr.mapper';

@ApiTags('qrs')
@ApiBearerAuth()
@Controller('qrs')
export class QrsController {
  private readonly logger = new Logger(QrsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly qrRestMapper: QrRestMapper,
  ) {}

  @Get(':id/image')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download QR PNG image' })
  @ApiProduces('image/png')
  @ApiResponse({ status: 200, description: 'PNG image' })
  async downloadImage(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    this.logger.log(`Downloading QR PNG image: ${id}`);
    const buffer = await this.queryBus.execute<QrFindPngByIdQuery, Buffer>(
      new QrFindPngByIdQuery({ qrId: id }),
    );

    return new StreamableFile(buffer, { type: 'image/png' });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get QR metadata by id' })
  @ApiResponse({ status: 200, type: QrRestResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QrRestResponseDto> {
    this.logger.log(`Finding QR by id: ${id}`);
    const result = await this.queryBus.execute<QrFindByIdQuery, QrViewModel>(
      new QrFindByIdQuery({ qrId: id }),
    );
    return this.qrRestMapper.toResponseDto(result);
  }

  @Post(':id/regenerate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Regenerate QR PNG (same URL)' })
  @ApiResponse({ status: 204, description: 'QR regenerated' })
  async regenerate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Regenerating QR: ${id}`);
    await this.commandBus.execute(new RegenerateQrCommand({ qrId: id }));
  }
}
