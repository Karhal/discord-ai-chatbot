# Use an official Node runtime as a parent image
FROM --platform=$BUILDPLATFORM node:18-slim AS builder
WORKDIR /usr/src/app

# Combine package copying and installation steps
COPY package*.json ./
RUN npm install -g tsup && npm ci

# Combine build steps
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build \
    && npm ci --only=production --ignore-scripts \
    && mv ./src/config.yaml.dist ./src/config.yaml \
    && npm prune --production

FROM --platform=$TARGETPLATFORM debian:bullseye-slim

# Combine user creation and dependency installation
RUN groupadd --gid 1000 node \
    && useradd --uid 1000 --gid node --shell /bin/bash --create-home node \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        nodejs \
    && apt-get purge -y --auto-remove curl gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /attachments \
    && chmod 777 /attachments

ENV NODE_ENV=production \
    PORT=3000

# Copie uniquement les fichiers nécessaires
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src/config.yaml ./src/config.yaml
COPY package.json ./

# Expose the port
EXPOSE 3000

ENTRYPOINT ["node"]
CMD ["dist/index.cjs"]