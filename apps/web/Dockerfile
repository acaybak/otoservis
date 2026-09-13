# === Build Stage ===
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

# === Production Stage ===
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing - all routes serve index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
