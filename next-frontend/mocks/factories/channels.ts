import type { paths } from "@/lib/api/types.gen";

export type Channel =
  paths["/me/channel"]["get"]["responses"][200]["content"]["application/json"];

export type PublicChannel =
  paths["/channels/{nickname}"]["get"]["responses"][200]["content"]["application/json"];

const baseChannel: Channel = {
  name: "Canal de Teste",
  nickname: "canal_de_teste",
  description: "Um canal de fixture para os testes",
};

export const buildChannel = (overrides: Partial<Channel> = {}): Channel => ({
  ...baseChannel,
  ...overrides,
});

const basePublicChannel: PublicChannel = {
  ...baseChannel,
  videosCount: 0,
  // Fase 06: contagem de inscritos e estado pessoal neutro — o do anônimo
  // (social-interactions-anonymous-gate/TD-02).
  subscribersCount: 0,
  viewerSubscribed: false,
};

export const buildPublicChannel = (
  overrides: Partial<PublicChannel> = {},
): PublicChannel => ({
  ...basePublicChannel,
  ...overrides,
});
