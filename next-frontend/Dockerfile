# Imagem de produção do BFF (testes-producao/TD-09, Option B: build local pelo
# compose da raiz, sem registry). Saída `standalone` do Next; os segredos
# (API_URL, SESSION_PASSWORD, INTERNAL_API_SECRET) chegam só em tempo de
# execução.
#
# Mesma base do Dockerfile.dev, para o build de produção rodar no Node do dev.

FROM node:22.16.0-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# O build não tem os segredos: a validação de env fica para a execução.
ENV NEXT_TELEMETRY_DISABLED=1
RUN SKIP_ENV_VALIDATION=1 npm run build


FROM node:22.16.0-slim AS runtime

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /home/node/app

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
