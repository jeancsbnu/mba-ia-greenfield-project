import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ChannelsService } from '../channels/channels.service';
import { ChannelNotFoundException } from '../common/exceptions/domain.exception';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import {
  ListPublicVideosQueryDto,
  ListVideosQueryDto,
} from './dto/list-videos-query.dto';
import { PublicChannelResponse } from '../channels/dto/channel-response.dto';
import {
  OwnerVideosPage,
  PublicVideosPage,
} from './dto/video-list-response.dto';
import { VideosService } from './videos.service';

// Vive em VideosModule, não em ChannelsModule: ChannelsModule não conhece
// VideosService, e inverter isso criaria dependência circular entre os dois.
@ApiTags('channels')
@Controller()
export class ChannelVideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Get('me/videos')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List the videos of the authenticated user channel',
    description:
      'Returns every video of the channel — drafts included — newest first, with offset/limit pagination and the channel total.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of the channel videos',
    schema: { $ref: getSchemaPath(OwnerVideosPage) },
  })
  @ApiResponse({
    status: 400,
    description: 'offset or limit out of range',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'The authenticated user has no channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async listMyVideos(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListVideosQueryDto,
  ) {
    const channel = await this.channelsService.findByUserId(user.sub);
    if (!channel) {
      throw new ChannelNotFoundException();
    }

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;

    const { items, total } = await this.videosService.listByChannel(
      channel.id,
      offset,
      limit,
    );

    return {
      items: await Promise.all(
        items.map(async (video) => ({
          publicId: video.public_id,
          title: video.title,
          durationSeconds: video.duration_seconds,
          thumbnailUrl: await this.videosService.resolveThumbnailUrl(video),
          status: video.status,
          visibility: video.visibility,
          publishedAt: video.published_at,
          category: video.category,
          viewsCount: video.views_count,
          likesCount: video.likes_count,
          commentsCount: video.comments_count,
        })),
      ),
      total,
      offset,
      limit,
    };
  }

  @Public()
  @Get('channels/:nickname')
  @ApiOperation({
    summary: 'Get a public channel',
    description:
      'Returns the public information of a channel. videosCount counts only published, public videos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel found',
    schema: { $ref: getSchemaPath(PublicChannelResponse) },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async getPublicChannel(@Param('nickname') nickname: string) {
    const channel = await this.channelsService.findByNicknameOrFail(nickname);

    return {
      name: channel.name,
      nickname: channel.nickname,
      description: channel.description,
      videosCount: await this.videosService.countPublicByChannel(channel.id),
    };
  }

  @Public()
  @Get('channels/:nickname/videos')
  @ApiOperation({
    summary: 'List the public videos of a channel',
    description:
      'Returns published, public videos only — drafts and unlisted videos are excluded. Newest published first.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of public videos',
    schema: { $ref: getSchemaPath(PublicVideosPage) },
  })
  @ApiResponse({
    status: 400,
    description: 'offset or limit out of range',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async listPublicChannelVideos(
    @Param('nickname') nickname: string,
    @Query() query: ListPublicVideosQueryDto,
  ) {
    const channel = await this.channelsService.findByNicknameOrFail(nickname);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 8;

    const { items, total } = await this.videosService.listPublicByChannel(
      channel.id,
      offset,
      limit,
    );

    return {
      items: await Promise.all(
        items.map(async (video) => ({
          publicId: video.public_id,
          title: video.title,
          durationSeconds: video.duration_seconds,
          thumbnailUrl: await this.videosService.resolveThumbnailUrl(video),
          viewsCount: video.views_count,
          publishedAt: video.published_at,
        })),
      ),
      total,
      offset,
      limit,
    };
  }
}
