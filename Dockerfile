FROM node:24-alpine AS development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]


# ============================================
# Build
# ============================================

FROM node:24-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ============================================
# Production
# ============================================

FROM node:24-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build --chown=node:node /usr/src/app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=15s \
  --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["npm", "run", "start:prod"]