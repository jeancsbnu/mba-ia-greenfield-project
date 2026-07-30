import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface VideoProcessingJobPayload {
  videoId: string;
  storageBucket: string;
  storageKey: string;
}

@Injectable()
export class VideoProcessingProducer {
  constructor(
    @InjectQueue('video-processing')
    private readonly queue: Queue<VideoProcessingJobPayload>,
  ) {}

  async enqueueProcessing(
    videoId: string,
    storageBucket: string,
    storageKey: string,
  ): Promise<void> {
    await this.queue.add('video.processing', {
      videoId,
      storageBucket,
      storageKey,
    });
  }
}
