import Link from "next/link"

import { ChannelAvatarUploader } from "@/components/channels/channel-avatar-uploader"
import { ChannelEditForm } from "@/components/channels/channel-edit-form"
import type { Channel } from "@/lib/api/contracts"
import { fetchFromUpstream } from "@/lib/api/server-upstream"
import { upstream } from "@/lib/api/upstream"
import type { ChannelEditValues } from "@/lib/channels/edit-schema"

const ROUTE = "/channel/settings"

export default async function ChannelSettingsPage() {
  const channel = await fetchFromUpstream<Channel>(
    (init) => upstream.GET("/me/channel", init),
    ROUTE
  )

  const defaultValues: ChannelEditValues = {
    nickname: channel.nickname,
    name: channel.name,
    description: channel.description ?? "",
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-12 lg:px-8">
      <ChannelAvatarUploader nickname={channel.nickname} name={channel.name} />

      <ChannelEditForm defaultValues={defaultValues}>
        <Link
          href="/channel/videos"
          className="text-label-md text-link underline underline-offset-4"
        >
          Cancelar
        </Link>
      </ChannelEditForm>
    </div>
  )
}
