# Spécifier la plateforme explicitement
FROM --platform=linux/amd64 node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install -g tsup
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

RUN npm ci --only=production --ignore-scripts
RUN mv ./src/config.yaml.dist ./src/config.yaml

# Spécifier la plateforme pour l'image finale aussi
FROM --platform=linux/amd64 node:18-alpine

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src/config.yaml ./src/config.yaml
COPY package.json ./

RUN mkdir -p /attachments && chmod 777 /attachments

ENV NODE_ENV=production
# Ajouter ENTRYPOINT explicite
ENTRYPOINT ["node"]
CMD ["dist/index.cjs"]