import { ReactionType } from '../../reactions/reaction-type.enum';
import {
  VideoCategory,
  VideoVisibility,
} from '../../videos/entities/video.entity';

// Dados de exemplo do banco de desenvolvimento. Tudo é referenciado por chaves
// legíveis (e-mail, nickname, publicId, key do comentário) para que as
// relações fiquem visíveis aqui; o dev-seed.ts resolve as chaves em ids.

// Senha de todas as contas do seed. Só existe no banco de desenvolvimento.
export const SEED_PASSWORD = 'streamtube123';

export interface SeedUser {
  email: string;
  channel: { name: string; nickname: string; description: string | null };
}

export const SEED_USERS: SeedUser[] = [
  {
    email: 'ana@streamtube.dev',
    channel: {
      name: 'Ana Codes',
      nickname: 'anacodes',
      description: 'Tutoriais curtos de programação web, TypeScript e Node.js.',
    },
  },
  {
    email: 'bruno@streamtube.dev',
    channel: {
      name: 'Bruno Beats',
      nickname: 'brunobeats',
      description: 'Produção musical, beats e bastidores de estúdio.',
    },
  },
  {
    email: 'carla@streamtube.dev',
    channel: {
      name: 'Carla em Campo',
      nickname: 'carlaemcampo',
      description: 'Esportes, treinos e a resenha da rodada.',
    },
  },
  {
    email: 'diego@streamtube.dev',
    channel: {
      name: 'Diego Joga',
      nickname: 'diegojoga',
      description: 'Gameplays, reviews de jogos indie e novidades da semana.',
    },
  },
  {
    // Só assiste, comenta e se inscreve: canal sem vídeos.
    email: 'elisa@streamtube.dev',
    channel: { name: 'Elisa', nickname: 'elisa', description: null },
  },
];

// Padrão de vídeo gerado pelo ffmpeg (fonte lavfi), sem arquivo de mídia no
// repositório. `options` e `filters` completam a fonte; tamanho e taxa de
// quadros vêm do renderizador.
export interface SeedVideoSource {
  source: string;
  options?: string;
  filters?: string;
  toneHz: number;
}

export interface SeedVideo {
  publicId: string;
  ownerEmail: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  visibility: VideoVisibility;
  // null = rascunho (published_at nulo): só o dono vê.
  publishedHoursAgo: number | null;
  viewsCount: number;
  durationSeconds: number;
  media: SeedVideoSource;
}

export const SEED_VIDEOS: SeedVideo[] = [
  {
    publicId: 'anaTs00001',
    ownerEmail: 'ana@streamtube.dev',
    title: 'TypeScript em 10 minutos: tipos que ajudam de verdade',
    description:
      'Union types, narrowing e generics com exemplos do dia a dia.\nCódigo no repositório do canal.',
    category: VideoCategory.TECNOLOGIA,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 48,
    viewsCount: 1520,
    durationSeconds: 8,
    media: { source: 'testsrc2', toneHz: 440 },
  },
  {
    publicId: 'anaNest001',
    ownerEmail: 'ana@streamtube.dev',
    title: 'NestJS do zero: módulos, controllers e services',
    description: 'Primeira aula da série sobre NestJS.',
    category: VideoCategory.EDUCACAO,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 9 * 24,
    viewsCount: 3870,
    durationSeconds: 10,
    media: { source: 'smptehdbars', toneHz: 523 },
  },
  {
    publicId: 'anaRasc001',
    ownerEmail: 'ana@streamtube.dev',
    title: 'Testes de integração com Postgres (rascunho)',
    description: null,
    category: VideoCategory.TECNOLOGIA,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: null,
    viewsCount: 0,
    durationSeconds: 6,
    media: { source: 'rgbtestsrc', toneHz: 330 },
  },
  {
    publicId: 'brunoLofi1',
    ownerEmail: 'bruno@streamtube.dev',
    title: 'Beat lo-fi para estudar',
    description: 'Um loop tranquilo para foco. Pode usar nos seus vídeos.',
    category: VideoCategory.MUSICA,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 20,
    viewsCount: 820,
    durationSeconds: 10,
    media: { source: 'gradients', options: 'speed=0.02', toneHz: 220 },
  },
  {
    publicId: 'brunoStd01',
    ownerEmail: 'bruno@streamtube.dev',
    title: 'Bastidores do estúdio: mixando uma faixa',
    description: 'Vídeo não listado: só quem tem o link assiste.',
    category: VideoCategory.MUSICA,
    visibility: VideoVisibility.UNLISTED,
    publishedHoursAgo: 5 * 24,
    viewsCount: 140,
    durationSeconds: 8,
    media: {
      source: 'gradients',
      options: 'type=radial:speed=0.03',
      toneHz: 262,
    },
  },
  {
    publicId: 'carlaTr001',
    ownerEmail: 'carla@streamtube.dev',
    title: 'Treino funcional de 15 minutos',
    description: 'Aquecimento, circuito e alongamento. Sem equipamento.',
    category: VideoCategory.ESPORTES,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 3 * 24,
    viewsCount: 2310,
    durationSeconds: 9,
    media: { source: 'testsrc2', filters: 'hue=h=120', toneHz: 392 },
  },
  {
    publicId: 'carlaRes01',
    ownerEmail: 'carla@streamtube.dev',
    title: 'Resenha da rodada: os melhores lances',
    description: null,
    category: VideoCategory.ESPORTES,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 12 * 24,
    viewsCount: 5400,
    durationSeconds: 7,
    media: { source: 'cellauto', options: 'rule=110', toneHz: 294 },
  },
  {
    publicId: 'carlaNot01',
    ownerEmail: 'carla@streamtube.dev',
    title: 'Notícias da semana no esporte',
    description: 'Transferências, lesões e o calendário dos próximos jogos.',
    category: VideoCategory.NOTICIAS,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 6,
    viewsCount: 310,
    durationSeconds: 6,
    media: { source: 'smptehdbars', filters: 'hue=h=200', toneHz: 349 },
  },
  {
    publicId: 'diegoInd01',
    ownerEmail: 'diego@streamtube.dev',
    title: 'Review: 5 jogos indie que merecem sua atenção',
    description: 'Do roguelike ao puzzle, cinco jogos pequenos e caprichados.',
    category: VideoCategory.JOGOS,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 4 * 24,
    viewsCount: 960,
    durationSeconds: 8,
    media: { source: 'mandelbrot', toneHz: 196 },
  },
  {
    publicId: 'diegoLif01',
    ownerEmail: 'diego@streamtube.dev',
    title: 'Simulando o Jogo da Vida de Conway',
    description: 'Autômato celular rodando ao vivo. Hipnotizante.',
    category: VideoCategory.ENTRETENIMENTO,
    visibility: VideoVisibility.PUBLIC,
    publishedHoursAgo: 7 * 24,
    viewsCount: 450,
    durationSeconds: 10,
    media: {
      source: 'life',
      options: 'mold=10:ratio=0.1:life_color=0x33cc66:death_color=0x202020',
      toneHz: 247,
    },
  },
];

// Inscrições: quem (e-mail) assina qual canal (nickname).
export const SEED_SUBSCRIPTIONS: { userEmail: string; channel: string }[] = [
  { userEmail: 'elisa@streamtube.dev', channel: 'anacodes' },
  { userEmail: 'elisa@streamtube.dev', channel: 'brunobeats' },
  { userEmail: 'elisa@streamtube.dev', channel: 'carlaemcampo' },
  { userEmail: 'diego@streamtube.dev', channel: 'anacodes' },
  { userEmail: 'carla@streamtube.dev', channel: 'anacodes' },
  { userEmail: 'bruno@streamtube.dev', channel: 'anacodes' },
  { userEmail: 'ana@streamtube.dev', channel: 'carlaemcampo' },
  { userEmail: 'ana@streamtube.dev', channel: 'diegojoga' },
  { userEmail: 'bruno@streamtube.dev', channel: 'diegojoga' },
];

export const SEED_VIDEO_REACTIONS: {
  userEmail: string;
  video: string;
  type: ReactionType;
}[] = [
  {
    userEmail: 'elisa@streamtube.dev',
    video: 'anaTs00001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'diego@streamtube.dev',
    video: 'anaTs00001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'bruno@streamtube.dev',
    video: 'anaTs00001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'carla@streamtube.dev',
    video: 'anaNest001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    video: 'anaNest001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'diego@streamtube.dev',
    video: 'anaNest001',
    type: ReactionType.DISLIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    video: 'brunoLofi1',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'ana@streamtube.dev',
    video: 'brunoLofi1',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'ana@streamtube.dev',
    video: 'carlaTr001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    video: 'carlaTr001',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'diego@streamtube.dev',
    video: 'carlaRes01',
    type: ReactionType.DISLIKE,
  },
  {
    userEmail: 'bruno@streamtube.dev',
    video: 'diegoInd01',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'ana@streamtube.dev',
    video: 'diegoInd01',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    video: 'diegoLif01',
    type: ReactionType.LIKE,
  },
];

// Comentários e respostas (profundidade 1: `parent` aponta sempre para um
// comentário-raiz, como o CommentsService grava).
export interface SeedComment {
  key: string;
  video: string;
  authorEmail: string;
  body: string;
  parent?: string;
  hoursAgo: number;
}

export const SEED_COMMENTS: SeedComment[] = [
  {
    key: 'ts-1',
    video: 'anaTs00001',
    authorEmail: 'elisa@streamtube.dev',
    body: 'Finalmente entendi narrowing! Faz um sobre generics avançados?',
    hoursAgo: 40,
  },
  {
    key: 'ts-1-r1',
    video: 'anaTs00001',
    authorEmail: 'ana@streamtube.dev',
    body: 'Faço sim, já está no roteiro da próxima semana.',
    parent: 'ts-1',
    hoursAgo: 38,
  },
  {
    key: 'ts-1-r2',
    video: 'anaTs00001',
    authorEmail: 'diego@streamtube.dev',
    body: 'Apoio! Generics é onde eu sempre travo.',
    parent: 'ts-1',
    hoursAgo: 30,
  },
  {
    key: 'ts-2',
    video: 'anaTs00001',
    authorEmail: 'bruno@streamtube.dev',
    body: 'Didática ótima, direto ao ponto.',
    hoursAgo: 20,
  },
  {
    key: 'nest-1',
    video: 'anaNest001',
    authorEmail: 'carla@streamtube.dev',
    body: 'Usei na faculdade e funcionou de primeira.',
    hoursAgo: 8 * 24,
  },
  {
    key: 'lofi-1',
    video: 'brunoLofi1',
    authorEmail: 'elisa@streamtube.dev',
    body: 'Trilha oficial das minhas tardes de estudo.',
    hoursAgo: 12,
  },
  {
    key: 'lofi-1-r1',
    video: 'brunoLofi1',
    authorEmail: 'bruno@streamtube.dev',
    body: 'Que bom! Vem mais um loop no fim de semana.',
    parent: 'lofi-1',
    hoursAgo: 10,
  },
  {
    key: 'treino-1',
    video: 'carlaTr001',
    authorEmail: 'ana@streamtube.dev',
    body: 'Fiz hoje cedo, acabou comigo (no bom sentido).',
    hoursAgo: 2 * 24,
  },
  {
    key: 'indie-1',
    video: 'diegoInd01',
    authorEmail: 'bruno@streamtube.dev',
    body: 'O terceiro da lista é sensacional, a trilha sonora é linda.',
    hoursAgo: 3 * 24,
  },
  {
    key: 'indie-1-r1',
    video: 'diegoInd01',
    authorEmail: 'diego@streamtube.dev',
    body: 'Né? Quase fiz um vídeo só sobre a trilha.',
    parent: 'indie-1',
    hoursAgo: 3 * 24 - 2,
  },
  {
    key: 'life-1',
    video: 'diegoLif01',
    authorEmail: 'elisa@streamtube.dev',
    body: 'Fiquei uns cinco minutos olhando sem piscar.',
    hoursAgo: 6 * 24,
  },
];

export const SEED_COMMENT_REACTIONS: {
  userEmail: string;
  comment: string;
  type: ReactionType;
}[] = [
  { userEmail: 'ana@streamtube.dev', comment: 'ts-1', type: ReactionType.LIKE },
  {
    userEmail: 'diego@streamtube.dev',
    comment: 'ts-1',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    comment: 'ts-1-r1',
    type: ReactionType.LIKE,
  },
  { userEmail: 'ana@streamtube.dev', comment: 'ts-2', type: ReactionType.LIKE },
  {
    userEmail: 'bruno@streamtube.dev',
    comment: 'lofi-1',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'carla@streamtube.dev',
    comment: 'treino-1',
    type: ReactionType.LIKE,
  },
  {
    userEmail: 'elisa@streamtube.dev',
    comment: 'indie-1',
    type: ReactionType.DISLIKE,
  },
  {
    userEmail: 'diego@streamtube.dev',
    comment: 'indie-1',
    type: ReactionType.LIKE,
  },
];
