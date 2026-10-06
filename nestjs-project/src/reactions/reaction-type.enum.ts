// Tipo compartilhado pelas duas tabelas de reação (social-interactions/TD-01).
// Um único tipo enum no banco (`reaction_type`) serve vídeo e comentário.
export enum ReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

export const REACTION_TYPE_ENUM_NAME = 'reaction_type';
