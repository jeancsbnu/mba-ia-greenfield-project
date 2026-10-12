import { VideoCard } from "@/components/videos/video-card"
import type { VideoFeedItem } from "@/lib/api/contracts"
import { formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type VideoGridProps = {
  items: VideoFeedItem[]
  size?: "desktop" | "mobile"
  className?: string
}

// Grade da home e dos resultados. Não faz fetch: recebe os itens da página
// RSC. 1 coluna; 2 em `sm`, 3 em `md`, 4 em `lg` — a página de 12 divide
// todas (home-busca/TD-02 e TD-08).
function VideoGrid({ items, size = "desktop", className }: VideoGridProps) {
  return (
    <ul
      data-slot="video-grid"
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <li key={item.publicId}>
          <VideoCard
            publicId={item.publicId}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            durationSeconds={item.durationSeconds}
            viewsCount={item.viewsCount}
            publishedAt={formatRelativeDate(item.publishedAt).label}
            channel={item.channel}
            size={size}
          />
        </li>
      ))}
    </ul>
  )
}

export { VideoGrid }
