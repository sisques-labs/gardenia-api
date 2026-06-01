import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipSpace } from '../../../../../shared/decorators/skip-space.decorator';
import { HealthResponseDto } from '../dtos/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
    };
  }
}
