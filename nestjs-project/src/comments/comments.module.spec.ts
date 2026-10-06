import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { Channel } from '../channels/entities/channel.entity';
import queueConfig from '../config/queue.config';
import storageConfig from '../config/storage.config';
import { CommentReaction } from '../reactions/entities/comment-reaction.entity';
import { VideoReaction } from '../reactions/entities/video-reaction.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { createTestDataSource } from '../test/create-test-data-source';
import { User } from '../users/entities/user.entity';
import { Video } from '../videos/entities/video.entity';
import { CommentsModule } from './comments.module';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Comment,
  VideoReaction,
  CommentReaction,
  Subscription,
];

describe('CommentsModule', () => {
  it('should compile with VideosModule, ReactionsModule and ChannelsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [storageConfig, queueConfig],
        }),
        TypeOrmModule.forRoot(createTestDataSource(ALL_ENTITIES).options),
        CommentsModule,
      ],
    }).compile();

    expect(module.get(CommentsService)).toBeInstanceOf(CommentsService);
    await module.close();
  }, 30000);
});
