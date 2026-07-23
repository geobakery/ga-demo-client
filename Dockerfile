FROM node:26-alpine AS build

# Let Node/corepack honor the proxy env the build tool forwards (e.g. podman)
ENV NODE_USE_ENV_PROXY=1

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

# Build args (override at build time, e.g. --build-arg VITE_SHOW_BBOX=true)
ARG VITE_API_URL="http://localhost:3000/v1"
ARG VITE_SHOW_BBOX=false

RUN VITE_API_URL=$VITE_API_URL VITE_SHOW_BBOX=$VITE_SHOW_BBOX pnpm run build

FROM nginx:alpine-slim

WORKDIR /usr/share/nginx/html/ga/demo-map/

COPY --from=build /app/dist ./
COPY ./default.conf /etc/nginx/conf.d/default.conf

ARG APP_UID=1001
ARG APP_GID=1001

# Create non-root user and fix permissions for nginx runtime directories
RUN addgroup -g ${APP_GID} appgroup && \
    adduser -u ${APP_UID} -G appgroup -s /bin/sh -D appuser && \
    mkdir -p /var/cache/nginx && \
    chown -R ${APP_UID}:${APP_GID} /var/cache/nginx /etc/nginx/conf.d && \
    touch /tmp/nginx.pid && chown ${APP_UID}:${APP_GID} /tmp/nginx.pid && \
    sed -i '/^user /d' /etc/nginx/nginx.conf && \
    sed -i 's|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf

USER ${APP_UID}

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
