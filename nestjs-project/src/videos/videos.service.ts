import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import {
  VideoForbiddenException,
  VideoNotFoundException,
  VideoNotPublishableException,
  VideoNotReadyException,
} from '../common/exceptions/domain.exception';
import { ChannelsService } from '../channels/channels.service';
import { StorageService } from '../storage/storage.service';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video, VideoStatus, VideoVisibility } from './entities/video.entity';

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

  // Painel do dono: todos os vídeos do canal, rascunhos incluídos, do mais
  // recente para o mais antigo, com o total para a paginação (TD-06).
  async listByChannel(
    channelId: string,
    offset: number,
    limit: number,
  ): Promise<{ items: Video[]; total: number }> {
    const [items, total] = await this.videoRepository.findAndCount({
      where: { channel_id: channelId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { items, total };
  }

  // Página pública do canal: só o que está no ar. Rascunho (published_at nulo)
  // e "Indisponível" (unlisted) ficam de fora — este último só por link direto
  // (TD-02). Ordem por published_at, não created_at: é a data que o público vê.
  async listPublicByChannel(
    channelId: string,
    offset: number,
    limit: number,
  ): Promise<{ items: Video[]; total: number }> {
    const [items, total] = await this.videoRepository.findAndCount({
      where: {
        channel_id: channelId,
        published_at: Not(IsNull()),
        visibility: VideoVisibility.PUBLIC,
      },
      order: { published_at: 'DESC' },
      skip: offset,
      take: limit,
    });
    return { items, total };
  }

  // Mesmo critério da listagem: o contador do cabeçalho não pode divergir dela.
  async countPublicByChannel(channelId: string): Promise<number> {
    return this.videoRepository.count({
      where: {
        channel_id: channelId,
        published_at: Not(IsNull()),
        visibility: VideoVisibility.PUBLIC,
      },
    });
  }

  // Uma única operação de salvar: campos de texto, troca de thumbnail e
  // publicação chegam juntos no mesmo multipart (TD-03, revisão 2026-09-20).
  async updateVideo(
    video: Video,
    dto: UpdateVideoDto,
    thumbnail?: Express.Multer.File,
  ): Promise<Video> {
    if (dto.title !== undefined) {
      video.title = dto.title;
    }
    if (dto.description !== undefined) {
      // String vazia significa "sem descrição", não descrição vazia.
      video.description = dto.description === '' ? null : dto.description;
    }
    if (dto.category !== undefined) {
      video.category = dto.category;
    }
    if (dto.visibility !== undefined) {
      video.visibility = dto.visibility;
    }

    if (dto.published === true) {
      if (video.status !== VideoStatus.READY) {
        throw new VideoNotPublishableException();
      }
      // Idempotente: republicar não reescreve a data original.
      video.published_at = video.published_at ?? new Date();
    } else if (dto.published === false) {
      // Despublicar não depende do status: o vídeo sai do ar de qualquer estado.
      video.published_at = null;
    }

    if (thumbnail) {
      video.custom_thumbnail_key = await this.storeCustomThumbnail(
        video,
        thumbnail,
      );
    }

    return this.videoRepository.save(video);
  }

  // Grava só em custom_thumbnail_key: thumbnail_key pertence ao worker (TD-04).
  private async storeCustomThumbnail(
    video: Video,
    thumbnail: Express.Multer.File,
  ): Promise<string> {
    const bucket = video.storage_bucket;
    if (!bucket) {
      throw new VideoNotReadyException();
    }

    const extension = thumbnail.mimetype.split('/')[1];
    const key = `thumbnails/${video.public_id}-${Date.now()}.${extension}`;
    await this.storageService.putObject(
      bucket,
      key,
      thumbnail.buffer,
      thumbnail.mimetype,
    );
    return key;
  }

  // URL única já resolvida (TD-04): a thumbnail customizada tem precedência
  // sobre a gerada pelo worker. O frontend nunca implementa essa precedência.
  async resolveThumbnailUrl(video: Video): Promise<string | null> {
    const key = video.custom_thumbnail_key ?? video.thumbnail_key;
    if (!key || !video.storage_bucket) {
      return null;
    }
    return this.storageService.getPresignedUrl(video.storage_bucket, key);
  }

  // Rascunho (published_at nulo) só existe para o dono; para qualquer outro
  // chamador a resposta é 404, não 403 — não revelamos que o vídeo existe.
  // Vem antes de assertReady para que o 404 tenha precedência sobre o 409.
  async assertServable(video: Video, userId?: string): Promise<void> {
    if (video.published_at !== null) {
      return;
    }
    if (!userId) {
      throw new VideoNotFoundException();
    }
    const channel = await this.channelsService.findByUserId(userId);
    if (!channel || channel.id !== video.channel_id) {
      throw new VideoNotFoundException();
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
