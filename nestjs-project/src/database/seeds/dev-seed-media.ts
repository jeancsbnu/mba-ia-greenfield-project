import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import type { SeedVideoSource } from './dev-seed.data';

export interface RenderedMedia {
  video: Buffer;
  thumbnail: Buffer;
}

export type MediaRenderer = (
  media: SeedVideoSource,
  durationSeconds: number,
) => Promise<RenderedMedia>;

export interface FfmpegRendererOptions {
  size: string;
  rate: number;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath as string, ['-hide_banner', ...args]);
    let stderr = '';
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
        return;
      }
      resolve();
    });
  });
}

// Gera um MP4 H.264/AAC tocável no navegador a partir de uma fonte lavfi e
// extrai a thumbnail do segundo 1, como o worker faz com vídeos enviados.
export function createFfmpegRenderer({
  size,
  rate,
}: FfmpegRendererOptions): MediaRenderer {
  return async (media, durationSeconds) => {
    const workDir = await mkdtemp(join(tmpdir(), 'dev-seed-'));
    const videoPath = join(workDir, 'video.mp4');
    const thumbnailPath = join(workDir, 'thumbnail.jpg');
    const source = [`${media.source}=size=${size}:rate=${rate}`, media.options]
      .filter(Boolean)
      .join(':');
    const videoInput = media.filters ? `${source},${media.filters}` : source;

    try {
      await runFfmpeg([
        '-y',
        '-f',
        'lavfi',
        '-i',
        videoInput,
        '-f',
        'lavfi',
        '-i',
        `sine=frequency=${media.toneHz}:sample_rate=44100`,
        '-t',
        String(durationSeconds),
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        videoPath,
      ]);
      await runFfmpeg([
        '-y',
        '-ss',
        '00:00:01',
        '-i',
        videoPath,
        '-vframes',
        '1',
        thumbnailPath,
      ]);
      return {
        video: await readFile(videoPath),
        thumbnail: await readFile(thumbnailPath),
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  };
}
