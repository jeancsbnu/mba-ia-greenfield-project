import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  Redirect,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import { ChannelAvatarService } from './channel-avatar.service';

@ApiTags('channels')
@Controller('channels')
export class ChannelAvatarController {
  constructor(private readonly channelAvatarService: ChannelAvatarService) {}

  // Fora do throttler: uma página com N avatares faz N leituras daqui, e o
  // limite global por visitante esgotaria em poucas navegações.
  @Public()
  @SkipThrottle()
  @Get(':nickname/avatar')
  @Redirect()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get a channel avatar',
    description:
      'Redirects to a presigned storage URL for the channel avatar. Accessible without authentication. 404 when the channel has no avatar — clients fall back to the initials.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to a presigned storage URL',
  })
  @ApiResponse({
    status: 404,
    description: 'CHANNEL_NOT_FOUND or AVATAR_NOT_FOUND',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async getAvatar(
    @Param('nickname') nickname: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.channelAvatarService.getAvatarUrl(nickname);
    return { url, statusCode: HttpStatus.FOUND };
  }
}
