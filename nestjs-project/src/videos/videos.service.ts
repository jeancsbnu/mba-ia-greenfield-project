import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VideoForbiddenException,
  VideoNotFoundException,
  VideoNotReadyException,
} from '../common/exceptions/domain.exception';
import { ChannelsService } from '../channels/channels.service';
import { StorageService } from '../storage/storage.service';
import { Video, VideoStatus } from './entities/video.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly channelsService: ChannelsService,
    private readonly storageService: StorageService,
  ) {}

  async findByPublicIdOrFail(publicId: string): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { public_id: publicId },
    });
    if (!video) {
      throw new VideoNotFoundException();
    }
    return video;
  }

  async assertOwnership(video: Video, userId: string): Promise<void> {
    const channel = await this.channelsService.findByUserId(userId);
    if (!channel || channel.id !== video.channel_id) {
      throw new VideoForbiddenException();
    }
  }

  async getStreamUrl(video: Video): Promise<string> {
    this.assertReady(video);
    return this.storageService.getPresignedUrl(
      video.storage_bucket as string,
      video.storage_key as string,
    );
  }

  async getDownloadUrl(video: Video): Promise<string> {
    this.assertReady(video);
    return this.storageService.getPresignedUrl(
      video.storage_bucket as string,
      video.storage_key as string,
      { responseContentDisposition: 'attachment' },
    );
  }

  private assertReady(video: Video): void {
    if (video.status !== VideoStatus.READY) {
      throw new VideoNotReadyException();
    }
  }
}
