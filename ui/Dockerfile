# Stage 1: build frontend
FROM node:20 AS builder
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build

# Stage 2: production (served by nginx)
FROM nginx:alpine
COPY --from=builder /app/build/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]