"use client"

import * as React from "react"

import { ThumbnailUploader } from "@/components/videos/thumbnail-uploader"
import { VideoEditForm } from "@/components/videos/video-edit-form"
import type { VideoEditValues } from "@/lib/videos/edit-schema"

type VideoEditPanelProps = {
  publicId: string
  thumbnailUrl: string | null
  defaultValues: VideoEditValues
  isPublished: boolean
  canPublish: boolean
}

// Dono do estado que as duas colunas compartilham: o arquivo escolhido no
// uploader precisa viajar no submit do formulário (TD-03), e o erro de
// thumbnail é exibido sob o uploader, não junto dos campos de texto.
function VideoEditPanel({
  publicId,
  thumbnailUrl,
  defaultValues,
  isPublished,
  canPublish,
}: VideoEditPanelProps) {
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null)
  const [thumbnailError, setThumbnailError] = React.useState<string | null>(null)

  return (
    <div className="flex items-start gap-6">
      <div className="w-80 shrink-0">
        <ThumbnailUploader
          thumbnailUrl={thumbnailUrl}
          error={thumbnailError}
          onFileSelect={(file) => {
            setThumbnailFile(file)
            setThumbnailError(null)
          }}
        />
      </div>

      <div className="flex-1 rounded-[var(--radius-4)] border border-border bg-muted/30 p-6">
        <VideoEditForm
          publicId={publicId}
          defaultValues={defaultValues}
          isPublished={isPublished}
          canPublish={canPublish}
          thumbnailFile={thumbnailFile}
          onThumbnailError={setThumbnailError}
        />
      </div>
    </div>
  )
}

export { VideoEditPanel }
