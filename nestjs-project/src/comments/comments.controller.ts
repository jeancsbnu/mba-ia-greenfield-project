import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import { SOCIAL_THROTTLE } from '../common/social-throttle.constants';
import { ReactionStateResponse } from '../reactions/dto/reaction-state-response.dto';
import { SetReactionDto } from '../reactions/dto/set-reaction.dto';
import { VideosService } from '../videos/videos.service';
import { CommentsService } from './comments.service';
import {
  CommentResponse,
  CommentsPage,
  RepliesPage,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { ListRepliesQueryDto } from './dto/list-replies-query.dto';

// Sem prefixo de classe: as rotas de comentário vivem sob dois recursos,
// /videos/{publicId}/comments e /comments/{commentId}/...
@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly videosService: VideosService,
  ) {}

  @Public()
  @Get('videos/:publicId/comments')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List the comments of a video',
    description:
      'Returns root comments newest first, each with up to 3 preloaded replies and the thread reply count. Paginated with offset/limit; the default page is 10 roots. Accessible without authentication; a valid bearer token only fills viewerReaction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments page',
    schema: { $ref: getSchemaPath(CommentsPage) },
  })
  @ApiResponse({
    status: 400,
    description: 'offset or limit outside the accepted range',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'Video not found, or a draft of another channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async listComments(
    @Param('publicId') publicId: string,
    @Query() query: ListCommentsQueryDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<CommentsPage> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertServable(video, user?.sub);
    return this.commentsService.listThreads(
      video.id,
      query.offset ?? 0,
      query.limit ?? 10,
      user?.sub,
    );
  }

  @Post('videos/:publicId/comments')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(SOCIAL_THROTTLE.COMMENTS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Post a comment or a reply',
    description:
      'Creates a root comment, or a reply when parentId is given. Replies are one level deep: replying to a reply attaches the new comment to the same root. Rate limited to 5 requests per 60 s per IP.',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created',
    schema: { $ref: getSchemaPath(CommentResponse) },
  })
  @ApiResponse({
    status: 400,
    description: 'Empty or too long body, or parentId that is not a uuid',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description:
      'Video not found or a draft of another channel, or parent comment not found in this video',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 requests per 60 s from the same IP',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async createComment(
    @Param('publicId') publicId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CommentResponse> {
    const video = await this.videosService.findByPublicIdOrFail(publicId);
    await this.videosService.assertServable(video, user.sub);
    return this.commentsService.create(video, user.sub, dto.body, dto.parentId);
  }

  @Public()
  @Get('comments/:commentId/replies')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List the replies of a comment',
    description:
      'Returns the replies of a root comment beyond the preloaded ones, newest first, with offset/limit pagination. A reply has no replies (one level deep), so asking for them returns an empty page. Accessible without authentication; a valid bearer token only fills viewerReaction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Replies page',
    schema: { $ref: getSchemaPath(RepliesPage) },
  })
  @ApiResponse({
    status: 400,
    description: 'commentId is not a uuid, or offset/limit out of range',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description:
      'Comment not found, or its video is a draft of another channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async listReplies(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query() query: ListRepliesQueryDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<RepliesPage> {
    const comment = await this.commentsService.findAccessible(
      commentId,
      user?.sub,
    );
    return this.commentsService.listReplies(
      comment.id,
      query.offset ?? 0,
      query.limit ?? 10,
      user?.sub,
    );
  }

  @Put('comments/:commentId/reaction')
  @Throttle(SOCIAL_THROTTLE.REACTIONS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Like or dislike a comment',
    description:
      'Records or switches the reaction of the authenticated user on a comment or reply and returns its like count after the operation. One reaction per user per comment. There is no public dislike count. Rate limited to 60 requests per 60 s per IP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction recorded',
    schema: { $ref: getSchemaPath(ReactionStateResponse) },
  })
  @ApiResponse({
    status: 400,
    description: 'commentId is not a uuid, or type is not like/dislike',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description:
      'Comment not found, or its video is a draft of another channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 429,
    description: 'More than 60 requests per 60 s from the same IP',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async setReaction(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: SetReactionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReactionStateResponse> {
    const comment = await this.commentsService.findAccessible(
      commentId,
      user.sub,
    );
    return this.commentsService.setReaction(comment, user.sub, dto.type);
  }

  @Delete('comments/:commentId/reaction')
  @Throttle(SOCIAL_THROTTLE.REACTIONS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Remove the reaction from a comment',
    description:
      'Removes the reaction of the authenticated user from a comment or reply and returns its like count. Idempotent. Rate limited to 60 requests per 60 s per IP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction removed',
    schema: { $ref: getSchemaPath(ReactionStateResponse) },
  })
  @ApiResponse({
    status: 400,
    description: 'commentId is not a uuid',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description:
      'Comment not found, or its video is a draft of another channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 429,
    description: 'More than 60 requests per 60 s from the same IP',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async removeReaction(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReactionStateResponse> {
    const comment = await this.commentsService.findAccessible(
      commentId,
      user.sub,
    );
    return this.commentsService.setReaction(comment, user.sub, null);
  }
}
