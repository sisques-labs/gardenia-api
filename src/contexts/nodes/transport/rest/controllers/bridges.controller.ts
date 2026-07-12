import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BootstrapBridgeCommand } from '@contexts/nodes/application/commands/bootstrap-bridge/bootstrap-bridge.command';
import { BootstrapBridgeResult } from '@contexts/nodes/application/commands/bootstrap-bridge/bootstrap-bridge.handler';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { BootstrapBridgeDto } from '../dtos/bootstrap-bridge.dto';
import { BridgeRestResponseDto } from '../dtos/bridge-rest-response.dto';

@ApiTags('nodes')
@Controller('nodes/bridges')
export class BridgesController {
  private readonly logger = new Logger(BridgesController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Post('bootstrap')
  @SkipSpace()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bridge self-announcement on first boot — no user auth, no space',
  })
  @ApiResponse({
    status: 200,
    description: 'Bridge registered/re-announced; pairing code issued',
    type: BridgeRestResponseDto,
  })
  async bootstrap(
    @Body() dto: BootstrapBridgeDto,
  ): Promise<BridgeRestResponseDto> {
    this.logger.log(`Bootstrap request from bridge ${dto.bridgeId}`);

    const result = await this.commandBus.execute<
      BootstrapBridgeCommand,
      BootstrapBridgeResult
    >(new BootstrapBridgeCommand({ bridgeId: dto.bridgeId }));

    return {
      bridgeId: result.bridgeId,
      pairingCode: result.pairingCode,
    };
  }
}
