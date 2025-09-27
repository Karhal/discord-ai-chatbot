FROM node:18-slim AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install -g tsup
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Installation des dépendances de production uniquement
RUN npm ci --only=production --ignore-scripts \
    && [ -f ./src/config.yaml ] || cp ./src/config.yaml.dist ./src/config.yaml \
    && npm prune --production

FROM node:18-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /attachments \
    && chmod 777 /attachments

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src/config.yaml ./src/config.yaml
COPY package.json ./

ENTRYPOINT ["node"]
CMD ["dist/index.cjs"]