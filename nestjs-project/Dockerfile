# Imagem de produção do nestjs-project (testes-producao/TD-09, Option B: build
# local pelo compose da raiz, sem registry). A mesma imagem roda a API
# (`node dist/main`, CMD padrão), o video-worker (`node dist/worker.main`) e o
# one-off `migrate` (`npm run migration:run:prod`, testes-producao/TD-06) — o
# compose troca só o comando.
#
# Mesma base do Dockerfile.dev, para o build de produção rodar no Node do dev.

FROM node:25.6.0-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# O `nest build` também copia os templates .hbs declarados em nest-cli.json.
RUN npm run build


FROM node:25.6.0-slim AS runtime

ENV NODE_ENV=production

WORKDIR /home/node/app

COPY package.json package-lock.json ./
# Só dependências de produção. O postinstall do ffmpeg-static/ffprobe-static
# baixa os binários que o worker usa.
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
