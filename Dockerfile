FROM node:24-alpine AS build

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY \
    HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    NODE_USE_ENV_PROXY=1

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

# Build args (override at build time, e.g. --build-arg VITE_SHOW_BBOX=true)
ARG VITE_API_URL="http://localhost:3000/v1"
ARG VITE_SHOW_BBOX=false

RUN VITE_API_URL=$VITE_API_URL VITE_SHOW_BBOX=$VITE_SHOW_BBOX pnpm run build

FROM registry.opencode.de/oci-community/images/zendis/nginx:1.26.3

COPY --from=build /app/dist /usr/share/nginx/html/ga/demo-map/
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
