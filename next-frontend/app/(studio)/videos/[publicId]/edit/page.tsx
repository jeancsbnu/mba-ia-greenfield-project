import { notFound } from "next/navigation"

import { BackLink } from "@/components/auth/back-link"
import { ChevronLeftIcon } from "@/components/icons/chevron-left-icon"
import { VideoEditPanel } from "@/components/videos/video-edit-panel"
import type { Video } from "@/lib/api/contracts"
import { fetchFromUpstream } from "@/lib/api/server-upstream"
import { upstream } from "@/lib/api/upstream"
import type { VideoEditValues } from "@/lib/videos/edit-schema"

export default async function VideoEditPage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params

  let video: Video
  try {
    video = await fetchFromUpstream<Video>(
      (init) =>
        upstream.GET("/videos/{publicId}", {
          ...init,
          params: { path: { publicId } },
        }),
      `/videos/${publicId}/edit`
    )
  } catch (error) {
    // redirect() do Next sinaliza por throw; repassá-lo é obrigatório, senão a
    // sessão expirada viraria "não encontrado".
    if (isNextControlFlow(error)) throw error
    // 403 e 404 caem no mesmo lugar: um 403 explícito revelaria que o vídeo
    // existe em outro canal (TD-09).
    notFound()
  }

  const defaultValues: VideoEditValues = {
    title: video.title,
    description: video.description ?? "",
    category: video.category,
    visibility: video.visibility,
  }

  return (
    <div className="flex flex-col gap-5 px-8 py-8">
      <BackLink
        href="/channel/videos"
        icon={<ChevronLeftIcon className="size-3.5" />}
      >
        Voltar para o painel
      </BackLink>

      <VideoEditPanel
        publicId={publicId}
        thumbnailUrl={video.thumbnailUrl}
        defaultValues={defaultValues}
        isPublished={video.publishedAt !== null}
        canPublish={video.status === "ready"}
      />
    </div>
  )
}

function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_")
  )
}
