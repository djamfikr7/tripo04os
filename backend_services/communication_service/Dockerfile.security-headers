FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S tripo04os -u 1001

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R tripo04os:nodejs /app

USER tripo04os

EXPOSE 8007

ENV NODE_ENV=production
ENV PORT=8007

CMD ["node", "dist/main"]
