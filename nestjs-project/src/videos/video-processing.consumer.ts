import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { Video, VideoStatus } from './entities/video.entity';
import type { VideoProcessingJobPayload } from './video-processing.producer';

function runCommand(
  binaryPath: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `${binaryPath} exited with code ${code}: ${stderr || stdout}`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

@Processor('video-processing')
export class VideoProcessingConsumer extends WorkerHost {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<VideoProcessingJobPayload>): Promise<void> {
    const { videoId, storageBucket, storageKey } = job.data;

    try {
      const durationSeconds = await this.processVideo(
        storageBucket,
        storageKey,
      );

      await this.videoRepository.update(videoId, {
        status: VideoStatus.READY,
        duration_seconds: durationSeconds.duration,
        thumbnail_key: durationSeconds.thumbnailKey,
        processing_error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.videoRepository.update(videoId, {
        status: VideoStatus.FAILED,
        processing_error: message,
      });
      throw error;
    }
  }

  private async processVideo(
    bucket: string,
    key: string,
  ): Promise<{ duration: number; thumbnailKey: string }> {
    const workDir = await mkdtemp(join(tmpdir(), 'video-processing-'));
    const inputPath = join(workDir, 'input');
    const thumbnailPath = join(workDir, 'thumbnail.jpg');

    try {
      await this.storageService.downloadToFile(bucket, key, inputPath);

      const duration = await this.extractDuration(inputPath);
      await this.generateThumbnail(inputPath, thumbnailPath);

      const thumbnailKey = `${key}-thumbnail.jpg`;
      const thumbnailBuffer = await readFile(thumbnailPath);
      await this.storageService.putObject(
        bucket,
        thumbnailKey,
        thumbnailBuffer,
        'image/jpeg',
      );

      return { duration, thumbnailKey };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async extractDuration(inputPath: string): Promise<number> {
    const { stdout } = await runCommand(ffprobePath as string, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      inputPath,
    ]);

    const parsed = JSON.parse(stdout) as { format?: { duration?: string } };
    const duration = Number.parseFloat(parsed.format?.duration ?? '');
    if (Number.isNaN(duration)) {
      throw new Error(`Could not parse video duration from ffprobe: ${stdout}`);
    }
    return Math.round(duration);
  }

  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    await runCommand(ffmpegPath as string, [
      '-y',
      '-ss',
      '00:00:01',
      '-i',
      inputPath,
      '-vframes',
      '1',
      outputPath,
    ]);
  }
}
