FROM node:20-alpine AS builder
WORKDIR /app

# 1. 复制依赖并安装 (由于是 Monorepo，注意对应你的目录结构)
COPY package*.json ./
# 如果你的项目有多个 apps，这里可以按需复制，或者直接复制全部
COPY . .

# 强行安装全部依赖
RUN npm install --legacy-peer-deps

# 2. 编译打包 Medusa 后端
RUN npm run build

# 3. 生产环境运行阶段
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app /app

# 安装代理依赖
RUN npm install http-proxy --legacy-peer-deps

EXPOSE 7860
EXPOSE 9000

# 启动我们刚刚写好的双端口网关脚本
CMD ["node", "hf-entrypoint.js"]