FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install -g tsup
RUN npm ci

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

RUN npm ci --only=production --ignore-scripts
RUN mv ./src/config.yaml.dist ./src/config.yaml
RUN cat ./src/config.yaml
FROM node:18-alpine

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src/config.yaml ./src/config.yaml
COPY package.json ./

ENV NODE_ENV=production
CMD ["node", "dist/index.cjs"]