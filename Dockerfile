# ==========================================
# 1. Dependências
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# ==========================================
# 2. Builder
# ==========================================
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

# ==========================================
# 3. Runner
# ==========================================
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules

# Script de inicialização para migrações e seed
COPY --chown=nextjs:nodejs <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e
echo "Aplicando schema do Prisma ao banco de dados..."
./node_modules/.bin/prisma db push --skip-generate || echo "Aviso: prisma db push falhou ou banco não está pronto"
echo "Executando seed de usuário inicial..."
node prisma/seed.js || echo "Aviso: seed ignorado ou usuário já existe"
echo "Iniciando servidor Plix..."
exec node server.js
EOF

RUN chmod +x /app/entrypoint.sh
USER nextjs

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
