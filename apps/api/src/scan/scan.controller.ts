import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiParam, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ScanService } from './scan.service';
import { ScanResult } from './scan.types';

const USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

@ApiTags('Scan')
@Controller('scan')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get(':username')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Scan a GitHub user and return their skill tree' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async scan(@Param('username') username: string): Promise<ScanResult> {
    if (!USERNAME_REGEX.test(username)) {
      throw new BadRequestException(
        'Invalid GitHub username. Must be 1-39 characters, alphanumeric or hyphens.',
      );
    }
    return this.scanService.scanUsername(username);
  }
}
