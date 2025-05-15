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
    && mv ./src/config.yaml.dist ./src/config.yaml \
    && npm prune --production

FROM debian:bullseye-slim

# Création de l'utilisateur node avant l'installation des paquets
RUN groupadd --gid 1000 node \
    && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=$(dpkg --print-architecture)] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs \
        google-chrome-stable \
    && apt-get purge -y --auto-remove curl gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /attachments \
    && chmod 777 /attachments

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src/config.yaml ./src/config.yaml
COPY package.json ./

ENTRYPOINT ["node"]
CMD ["dist/index.cjs"]