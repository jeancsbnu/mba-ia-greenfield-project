---
libs:
  "multer":
    version: "2.1.1 (installed; transitive dependency of @nestjs/platform-express 11.1.16)"
    context7_id: "N/A — context7 not configured in this project (.mcp.json has no context7 server); distilled from docs.nestjs.com/techniques/file-upload and github.com/expressjs/multer"
    fetched_at: "2026-09-20T20:35:36-03:00"
sources_mtime:
  docs/decisions/technical-decisions-video-channel-management.md: "2026-09-20T20:35:29-03:00"
---

# Library References — phase-04-video-channel-management

Distilled for the surfaces this phase uses. Source: official NestJS docs + multer README (Context7 unavailable in this project, same convention as `phase-03-upload-processing/library-refs.md`).

### multer _(TD-03)_

**Usage in this phase:** upload of the custom thumbnail in the same `multipart/form-data` request as the video edit form (see the 2026-09-20 revision of TD-03). Server-side validation before persisting is the whole point of TD-03's Option A.

- **No direct dependency to add.** `multer` (2.1.1) is already installed as a dependency of `@nestjs/platform-express` (^11.0.1 in `nestjs-project/package.json`). Use it through Nest's interceptors instead of importing `multer` directly.
- **Types:** `Express.Multer.File` requires `npm i -D @types/multer` — it is **not** in `nestjs-project/package.json` today; add it as a devDependency when the first SI that types `@UploadedFile()` lands.
- **Single file + text fields:**

  ```typescript
  @Patch(':publicId')
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Body() dto: UpdateVideoDto,                 // text parts arrive as strings
    @UploadedFile(new ParseFilePipeBuilder()
      .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
      .addMaxSizeValidator({ maxSize: 2 * 1024 * 1024 })
      .build({ fileIsRequired: false, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
    thumbnail?: Express.Multer.File,
  ) { /* ... */ }
  ```

  The thumbnail is optional on edit (`fileIsRequired: false`): title/description/category/visibility can change without a new file. Limits above are illustrative — the real MIME allowlist and size cap are Technical actions for `/plan-build`, not decided by TD-03.
- **Validators:** `MaxFileSizeValidator` (bytes) and `FileTypeValidator` (MIME string or RegExp) via `ParseFilePipe` / `ParseFilePipeBuilder`. `FileTypeValidator` (verified in the installed `@nestjs/common` 11.x source) checks the file's magic numbers through the `file-type` package on `file.buffer` — the server-side inspection TD-03 relies on, and the reason `memoryStorage` is needed. It falls back to the client MIME type and logs a warning if `file-type` cannot be resolved (or when `skipMagicNumbersValidation` is set), so confirm the package resolves when the SI is implemented.
- **Storage:** default `memoryStorage` (Buffer in `file.buffer`) is the right fit for a small image that is forwarded to the object storage right after validation; `diskStorage` is unnecessary here. Set `limits.fileSize` on the interceptor (`FileInterceptor('thumbnail', { limits: { fileSize } })`) so oversize bodies are cut off by multer itself before reaching the pipe (surfaces as `MulterError` code `LIMIT_FILE_SIZE`; map it in the exception filter to a domain error).
- **Text fields are strings.** With multipart, everything in `@Body()` arrives as a string — `class-transformer` (`@Type`, `@Transform`) is needed for non-string DTO fields; enum fields (`category`, `visibility`) validate fine as strings.
- **Express only.** `FileInterceptor` is incompatible with `FastifyAdapter`; this project uses the Express platform, so no action.
- **Gotcha — BFF forwarding (frontend):** the Next.js Route Handler that proxies the edit must forward the browser's `multipart/form-data` (rebuild a `FormData`, do not set `Content-Type` manually so the boundary is generated). `openapi-fetch` needs a `bodySerializer` for multipart bodies. Cover with the `*.integration.test.ts` + MSW recipe.
