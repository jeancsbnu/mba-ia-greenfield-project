import { withStorageContentType } from './upload-content-type';

describe('withStorageContentType', () => {
  it('copies a video filetype into contentType, keeping the other keys', () => {
    expect(
      withStorageContentType({ title: 'My Video', filetype: 'video/mp4' }),
    ).toEqual({
      title: 'My Video',
      filetype: 'video/mp4',
      contentType: 'video/mp4',
    });
  });

  it('accepts video subtypes with dots, dashes and plus signs', () => {
    expect(
      withStorageContentType({ filetype: 'video/x-matroska' })?.contentType,
    ).toBe('video/x-matroska');
    expect(
      withStorageContentType({ filetype: 'video/vnd.dlna.mpeg-tts' })
        ?.contentType,
    ).toBe('video/vnd.dlna.mpeg-tts');
  });

  it.each([
    ['text/html'],
    ['image/svg+xml'],
    ['video/mp4; charset=utf-8'],
    ['video/'],
    [''],
  ])('does not copy %p', (filetype) => {
    const metadata = { filetype };
    expect(withStorageContentType(metadata)).toBe(metadata);
  });

  it('leaves metadata without filetype untouched', () => {
    const metadata = { title: 'No type' };
    expect(withStorageContentType(metadata)).toBe(metadata);
    expect(withStorageContentType(undefined)).toBeUndefined();
  });
});
