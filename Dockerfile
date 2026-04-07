# --- 第一阶段：运行环境 ---
# 使用轻量级的 Alpine 镜像
FROM node:20-alpine AS runner

WORKDIR /app

# 设置为生产模式
ENV NODE_ENV production
# 告诉 Next.js 监听所有网络接口
ENV HOSTNAME "0.0.0.0"
ENV PORT=3000

# 1. 创建非 root 用户以增强安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 2. 拷贝构建产物 (重点)
# 注意：这些文件是在你刚刚执行 npm run build 后生成的
# 确保路径是相对路径，去掉开头的斜杠（如果有的话）
COPY --chown=nextjs:nodejs ./.next/standalone ./
COPY --chown=nextjs:nodejs ./.next/static ./.next/static
COPY --chown=nextjs:nodejs ./public ./public

# 3. 切换到安全用户
USER nextjs

# 4. 暴露端口
EXPOSE 3000

# 5. 启动服务 (standalone 模式下入口是 server.js)
CMD ["node", "server.js"]