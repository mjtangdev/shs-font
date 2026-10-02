# 第一阶段：编译阶段
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
# 启用 corepack 并安装与项目匹配的 pnpm 版本
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 声明构建参数并设置为环境变量
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
# 增加 Node.js 内存限制以防止编译时 OOM
ENV NODE_OPTIONS=--max-old-space-size=8192

COPY . .
RUN pnpm exec next build

# 第二阶段：运行阶段
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# --- 关键修复点：在第二阶段重新声明 ARG 以接收第一阶段的值 ---
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 拷贝 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 安全配置
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]