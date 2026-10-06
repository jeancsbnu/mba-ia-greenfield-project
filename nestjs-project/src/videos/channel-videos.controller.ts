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
import { ListSubscriptionsQueryDto } from '../subscriptions/dto/list-subscriptions-query.dto';
import { SubscribedChannelsPage } from '../subscriptions/dto/subscribed-channels-response.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
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
    private readonly subscriptionsService: SubscriptionsService,
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

  @Get('me/subscriptions')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List the channels the authenticated user follows',
    description:
      'Returns the followed channels, most recent subscription first, with subscriber count and the count of published, public videos. Paginated with offset/limit; the default page is 50.',
  })
  @ApiResponse({
    status: 200,
    description: 'Followed channels page',
    schema: { $ref: getSchemaPath(SubscribedChannelsPage) },
  })
  @ApiResponse({
    status: 400,
    description: 'offset or limit out of range',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async listMySubscriptions(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListSubscriptionsQueryDto,
  ): Promise<SubscribedChannelsPage> {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;

    const { items, total } = await this.subscriptionsService.listByUser(
      user.sub,
      offset,
      limit,
    );
    const videosCounts = await this.videosService.countPublicByChannels(
      items.map((channel) => channel.id),
    );

    return {
      items: items.map((channel) => ({
        name: channel.name,
        nickname: channel.nickname,
        subscribersCount: channel.subscribers_count,
        videosCount: videosCounts.get(channel.id) ?? 0,
      })),
      total,
      offset,
      limit,
    };
  }

  @Public()
  @Get('channels/:nickname')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a public channel',
    description:
      'Returns the public information of a channel. videosCount counts only published, public videos. A valid bearer token is optional and only fills viewerSubscribed.',
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
  async getPublicChannel(
    @Param('nickname') nickname: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PublicChannelResponse> {
    const channel = await this.channelsService.findByNicknameOrFail(nickname);
    const [videosCount, viewerSubscribed] = await Promise.all([
      this.videosService.countPublicByChannel(channel.id),
      user
        ? this.subscriptionsService.isSubscribed(user.sub, channel.id)
        : Promise.resolve(false),
    ]);

    return {
      name: channel.name,
      nickname: channel.nickname,
      description: channel.description,
      videosCount,
      subscribersCount: channel.subscribers_count,
      viewerSubscribed,
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
