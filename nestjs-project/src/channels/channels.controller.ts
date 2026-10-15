import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChannelNotFoundException } from '../common/exceptions/domain.exception';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import { ChannelsService } from './channels.service';
import { ChannelResponse } from './dto/channel-response.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';

@ApiTags('channels')
@Controller('me/channel')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  private toResponse(channel: Channel) {
    return {
      name: channel.name,
      nickname: channel.nickname,
      description: channel.description,
    };
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the authenticated user channel',
    description:
      'Returns name, nickname and description of the channel owned by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel found',
    schema: { $ref: getSchemaPath(ChannelResponse) },
  })
  @ApiResponse({
    status: 404,
    description: 'The authenticated user has no channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async getMyChannel(@CurrentUser() user: JwtPayload) {
    const channel = await this.channelsService.findByUserId(user.sub);
    if (!channel) {
      throw new ChannelNotFoundException();
    }
    return this.toResponse(channel);
  }

  @Patch()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update the authenticated user channel',
    description:
      'Edits nickname, name and description. Changing the nickname changes the public channel URL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel updated',
    schema: { $ref: getSchemaPath(ChannelResponse) },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or empty body',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 404,
    description: 'The authenticated user has no channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  @ApiResponse({
    status: 409,
    description: 'Nickname already belongs to another channel',
    schema: { $ref: getSchemaPath(ApiErrorEnvelope) },
  })
  async updateMyChannel(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateChannelDto,
  ) {
    // Object.keys não serve: com useDefineForClassFields (target ES2023) as
    // propriedades opcionais existem como undefined mesmo num corpo vazio.
    const hasAnyField = Object.values(dto).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new BadRequestException('No fields to update');
    }

    const channel = await this.channelsService.updateChannel(user.sub, dto);
    return this.toResponse(channel);
  }
}
