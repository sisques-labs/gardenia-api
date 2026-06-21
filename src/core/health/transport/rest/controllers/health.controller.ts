import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { SkipSpace } from '../../../../../shared/decorators/skip-space.decorator';
import { HealthResponseDto } from '../dtos/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly mqttService: MqttService) {}

  @Get()
  @SkipSpace()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  check(): HealthResponseDto {
    this.logger.debug('Health check called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mqtt: this.resolveMqttStatus(),
    };
  }

  private resolveMqttStatus(): 'disabled' | 'up' | 'down' {
    if (!this.mqttService.enabled) {
      return 'disabled';
    }
    return this.mqttService.connected ? 'up' : 'down';
  }
}
