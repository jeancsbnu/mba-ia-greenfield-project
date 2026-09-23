import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MSW e seus interceptors precisam ficar FORA do bundle do servidor: se o
  // Turbopack os empacota, eles patcheiam cópias dos módulos em vez das
  // instâncias reais que o fetch de servidor do Next usa, e nenhuma chamada
  // chega a ser interceptada.
  serverExternalPackages: ["msw", "@mswjs/interceptors"],
  async rewrites() {
    return [
      // A URL pública do canal é /@{nickname} (TD-08). Não dá para criar a
      // pasta `app/@nickname`: no App Router uma pasta iniciada por "@" é slot
      // de rota paralela, não segmento de URL. O rewrite mantém a URL bonita
      // apontando para a rota dinâmica real.
      {
        source: "/@:nickname",
        destination: "/channels/:nickname",
      },
    ];
  },
};

export default nextConfig;
