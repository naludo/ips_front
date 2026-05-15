# 使用官方 Node.js 镜像作为构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制项目源代码
COPY . .

# 构建生产版本
RUN npm run build

# 使用官方 Nginx 镜像作为运行阶段
FROM nginx:alpine

# 复制构建产物到 Nginx 的静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
