import { SubscribedChannelList } from "@/components/channels/subscribed-channel-list"
import type { SubscribedChannelsPage } from "@/lib/api/contracts"
import { fetchFromUpstream } from "@/lib/api/server-upstream"
import { upstream } from "@/lib/api/upstream"

const ROUTE = "/channel/subscriptions"

function channelsLabel(total: number): string {
  return total === 1 ? "1 canal" : `${String(total)} canais`
}

// Lista de canais seguidos, não feed (social-interactions/TD-07). O layout do
// grupo (studio) já garante a sessão; o returnTo traz o usuário de volta aqui
// depois de renovar o token.
export default async function ChannelSubscriptionsPage() {
  const data = await fetchFromUpstream<SubscribedChannelsPage>(
    (init) => upstream.GET("/me/subscriptions", init),
    ROUTE
  )

  return (
    <div className="flex flex-col gap-6 px-12 py-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h2 text-foreground">Canais que você segue</h1>
        <p className="text-caption text-muted-foreground">
          {channelsLabel(data.total)}
        </p>
      </div>

      <SubscribedChannelList channels={data.items} />
    </div>
  )
}
