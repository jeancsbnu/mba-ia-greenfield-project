import { getQueueToken } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Queue } from 'bullmq';
import queueConfig from '../config/queue.config';
import { QueueModule } from '../queue/queue.module';
import { VideoProcessingProducer } from './video-processing.producer';

describe('VideoProcessingProducer (integration)', () => {
  let producer: VideoProcessingProducer;
  let queue: Queue;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [queueConfig] }),
        QueueModule,
      ],
      providers: [VideoProcessingProducer],
    }).compile();
    await module.init();

    producer = module.get(VideoProcessingProducer);
    queue = module.get(getQueueToken('video-processing'));
  });

  afterAll(async () => {
    await queue.close();
  });

  beforeEach(async () => {
    await queue.drain(true);
  });

  it('enqueues a job in the video-processing queue with the expected payload', async () => {
    await producer.enqueueProcessing(
      'video-id-1',
      'videos-bucket',
      'videos/video-id-1/original.mp4',
    );

    const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe('video.processing');
    expect(jobs[0].data).toEqual({
      videoId: 'video-id-1',
      storageBucket: 'videos-bucket',
      storageKey: 'videos/video-id-1/original.mp4',
    });
  });
});
