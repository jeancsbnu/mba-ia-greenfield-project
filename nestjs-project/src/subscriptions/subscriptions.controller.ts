import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
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
import { ChannelsService } from '../channels/channels.service';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import { SOCIAL_THROTTLE } from '../common/social-throttle.constants';
import { SubscriptionStateResponse } from './dto/subscription-state-response.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('channels')
@Controller('channels')
export class SubscriptionsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Put(':nickname/subscription')
  @HttpCode(HttpStatus.OK)
  @Throttle(SOCIAL_THROTTLE.REACTIONS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Subscribe to a channel',
    description:
      'Follows the channel and returns the subscriber count after the operation. Idempotent: subscribing again keeps the count. Rate limited to 60 requests per 60 s per IP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscribed',
    schema: { $ref: getSchemaPath(SubscriptionStateResponse) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 429,
    description: 'More than 60 requests per 60 s from the same IP',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async subscribe(
    @Param('nickname') nickname: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionStateResponse> {
    const channel = await this.channelsService.findByNicknameOrFail(nickname);
    return this.subscriptionsService.subscribe(user.sub, channel);
  }

  @Delete(':nickname/subscription')
  @HttpCode(HttpStatus.OK)
  @Throttle(SOCIAL_THROTTLE.REACTIONS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Unsubscribe from a channel',
    description:
      'Stops following the channel and returns the subscriber count after the operation. Idempotent: unsubscribing again keeps the count. Rate limited to 60 requests per 60 s per IP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unsubscribed',
    schema: { $ref: getSchemaPath(SubscriptionStateResponse) },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid bearer token',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'Channel not found',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 429,
    description: 'More than 60 requests per 60 s from the same IP',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async unsubscribe(
    @Param('nickname') nickname: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionStateResponse> {
    const channel = await this.channelsService.findByNicknameOrFail(nickname);
    return this.subscriptionsService.unsubscribe(user.sub, channel);
  }
}
