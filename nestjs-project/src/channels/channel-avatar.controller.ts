import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Put,
  Redirect,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME,
  ChannelAvatarService,
} from './channel-avatar.service';

@ApiTags('channels')
@Controller()
export class ChannelAvatarController {
  constructor(private readonly channelAvatarService: ChannelAvatarService) {}

  // Fora do throttler: uma página com N avatares faz N leituras daqui, e o
  // limite global por visitante esgotaria em poucas navegações.
  @Public()
  @SkipThrottle()
  @Get('channels/:nickname/avatar')
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

  @Put('me/channel/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Set the authenticated user channel avatar',
    description:
      'Replaces the channel avatar with a JPEG, PNG or WebP image of up to 2 MB. The previous image is deleted.',
  })
  @ApiResponse({ status: 204, description: 'Avatar replaced' })
  @ApiResponse({
    status: 400,
    description: 'Missing file, unsupported type or file over 2 MB',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'The authenticated user has no channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: AVATAR_MAX_BYTES } }),
  )
  async setMyAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: AVATAR_MIME })
        .addMaxSizeValidator({ maxSize: AVATAR_MAX_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    avatar: Express.Multer.File,
  ): Promise<void> {
    await this.channelAvatarService.setAvatar(user.sub, avatar);
  }

  @Delete('me/channel/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Remove the authenticated user channel avatar',
    description:
      'Removes the avatar so the channel falls back to its initials. Idempotent.',
  })
  @ApiResponse({
    status: 204,
    description: 'Avatar removed (or there was none)',
  })
  @ApiResponse({
    status: 404,
    description: 'The authenticated user has no channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async removeMyAvatar(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.channelAvatarService.removeAvatar(user.sub);
  }
}
