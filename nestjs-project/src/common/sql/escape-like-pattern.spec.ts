import { escapeLikePattern } from './escape-like-pattern';

describe('escapeLikePattern', () => {
  it('escapes the LIKE wildcards', () => {
    expect(escapeLikePattern('50%_off')).toBe('50\\%\\_off');
  });

  it('escapes the escape character itself', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%');
  });

  it('leaves a term without wildcards unchanged', () => {
    expect(escapeLikePattern('Música ao vivo')).toBe('Música ao vivo');
  });
});
