import { Controller, Get, HttpStatus, Param, Redirect } from '@nestjs/common';
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
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get(':publicId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get video status',
    description:
      'Returns the current status and metadata of a video. Only the owning channel can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Video found',
    schema: {
      properties: {
        publicId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        status: {
          type: 'string',
          enum: ['draft', 'processing', 'ready', 'failed'],
        },
        durationSeconds: { type: 'number', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user does not own the video',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async getVideo(
    @Param('publicId') publicId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertOwnership(video, user.sub);

    return {
      publicId: video.public_id,
      title: video.title,
      description: video.description,
      status: video.status,
      durationSeconds: video.duration_seconds,
      createdAt: video.created_at,
    };
  }

  @Public()
  @Get(':publicId/stream')
  @Redirect()
  @ApiOperation({
    summary: 'Stream a video',
    description:
      'Redirects to a presigned storage URL for the video file. Accessible without authentication.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to a presigned storage URL',
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description: 'Video is not ready for streaming',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async stream(
    @Param('publicId') publicId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    const url = await this.videosService.getStreamUrl(video);
    return { url, statusCode: HttpStatus.FOUND };
  }

  @Public()
  @Get(':publicId/download')
  @Redirect()
  @ApiOperation({
    summary: 'Download a video',
    description:
      'Redirects to a presigned storage URL for downloading the video file. Accessible without authentication.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to a presigned storage URL (attachment)',
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description: 'Video is not ready for download',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async download(
    @Param('publicId') publicId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    const url = await this.videosService.getDownloadUrl(video);
    return { url, statusCode: HttpStatus.FOUND };
  }
}
