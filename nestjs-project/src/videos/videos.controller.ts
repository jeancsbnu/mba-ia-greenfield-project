import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  ParseFilePipeBuilder,
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
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideosService } from './videos.service';
import { VideoDetailResponse } from './dto/video-detail-response.dto';
import { VideoCategory, VideoVisibility } from './entities/video.entity';

const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
const THUMBNAIL_MIME = /^image\/(jpeg|png|webp)$/;

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
    schema: { $ref: getSchemaPath(VideoDetailResponse) },
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
      category: video.category,
      visibility: video.visibility,
      publishedAt: video.published_at,
      thumbnailUrl: await this.videosService.resolveThumbnailUrl(video),
    };
  }

  @Patch(':publicId')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update a video',
    description:
      'Edits title, description, category and visibility, replaces the custom thumbnail and publishes or unpublishes the video in a single multipart call. Only the owning channel can access this endpoint.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', nullable: true },
        category: { type: 'string', enum: Object.values(VideoCategory) },
        visibility: { type: 'string', enum: Object.values(VideoVisibility) },
        published: { type: 'boolean' },
        thumbnail: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video updated — same shape as GET /videos/{publicId}',
    schema: { $ref: getSchemaPath(VideoDetailResponse) },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or unsupported thumbnail type',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user does not own the video',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description:
      'Video is still processing or failed, so it cannot be published',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: { fileSize: THUMBNAIL_MAX_BYTES },
    }),
  )
  async updateVideo(
    @Param('publicId') publicId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateVideoDto,
    // A validação acontece no servidor antes de persistir — é o ponto central
    // do TD-03. Arquivo é opcional: o corpo pode trazer só campos de texto.
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: THUMBNAIL_MIME })
        .addMaxSizeValidator({ maxSize: THUMBNAIL_MAX_BYTES })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    thumbnail?: Express.Multer.File,
  ) {
    // Object.keys não serve: com useDefineForClassFields (target ES2023) as
    // propriedades opcionais existem como undefined mesmo num corpo vazio.
    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField && !thumbnail) {
      throw new BadRequestException('No fields to update');
    }

    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertOwnership(video, user.sub);

    const updated = await this.videosService.updateVideo(video, dto, thumbnail);

    return {
      publicId: updated.public_id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      durationSeconds: updated.duration_seconds,
      createdAt: updated.created_at,
      category: updated.category,
      visibility: updated.visibility,
      publishedAt: updated.published_at,
      thumbnailUrl: await this.videosService.resolveThumbnailUrl(updated),
    };
  }

  @Public()
  @Get(':publicId/stream')
  @Redirect()
  @ApiOperation({
    summary: 'Stream a video',
    description:
      'Redirects to a presigned storage URL for the video file. Accessible without authentication. A valid bearer token is optional and only identifies the channel owner, who may also stream their own drafts.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 302,
    description: 'Redirects to a presigned storage URL',
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found, or a draft requested by someone else',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description: 'Video is not ready for streaming',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async stream(
    @Param('publicId') publicId: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ url: string; statusCode: number }> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertServable(video, user?.sub);
    const url = await this.videosService.getStreamUrl(video);
    return { url, statusCode: HttpStatus.FOUND };
  }

  @Public()
  @Get(':publicId/download')
  @Redirect()
  @ApiOperation({
    summary: 'Download a video',
    description:
      'Redirects to a presigned storage URL for downloading the video file. Accessible without authentication. A valid bearer token is optional and only identifies the channel owner, who may also download their own drafts.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 302,
    description: 'Redirects to a presigned storage URL (attachment)',
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found, or a draft requested by someone else',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description: 'Video is not ready for download',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async download(
    @Param('publicId') publicId: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ url: string; statusCode: number }> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertServable(video, user?.sub);
    const url = await this.videosService.getDownloadUrl(video);
    return { url, statusCode: HttpStatus.FOUND };
  }
}
