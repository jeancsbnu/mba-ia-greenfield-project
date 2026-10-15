type UploadMetadata = Record<string, string | null> | undefined;

const VIDEO_MIME_TYPE = /^video\/[\w.+-]+$/;

/**
 * Copies the client's `filetype` into the `contentType` key that
 * `@tus/s3-store` reads when it creates the multipart upload, so the object is
 * stored (and later served) with its real media type instead of
 * `binary/octet-stream`.
 *
 * Only `video/*` values are copied: the type is client-declared, and letting
 * any value through would let an uploader make the storage serve, e.g.,
 * `text/html`. Anything else keeps the previous behaviour (no ContentType).
 */
export function withStorageContentType(
  metadata: UploadMetadata,
): UploadMetadata {
  const filetype = metadata?.filetype;
  if (!filetype || !VIDEO_MIME_TYPE.test(filetype)) {
    return metadata;
  }
  return { ...metadata, contentType: filetype };
}
