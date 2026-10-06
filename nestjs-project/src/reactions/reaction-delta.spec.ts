import { likesDelta } from './reaction-delta';
import { ReactionType } from './reaction-type.enum';

const { LIKE, DISLIKE } = ReactionType;

// A tabela de delta do social-interactions/TD-02, linha a linha — inclusive as
// idempotentes, que são as que impedem o contador de desviar sob repetição.
describe('likesDelta', () => {
  it.each([
    ['none → like', null, LIKE, 1],
    ['like → none', LIKE, null, -1],
    ['like → dislike', LIKE, DISLIKE, -1],
    ['dislike → like', DISLIKE, LIKE, 1],
    ['none → dislike', null, DISLIKE, 0],
    ['dislike → none', DISLIKE, null, 0],
    ['like → like', LIKE, LIKE, 0],
    ['dislike → dislike', DISLIKE, DISLIKE, 0],
    ['none → none', null, null, 0],
  ])('should return the delta for %s', (_label, previous, next, expected) => {
    expect(likesDelta(previous, next)).toBe(expected);
  });
});
