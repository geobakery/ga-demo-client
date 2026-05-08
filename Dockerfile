FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

# Build argument for API URL with default value
ARG VITE_API_URL="http://localhost:3000/v1"

RUN pnpm run build

FROM registry.opencode.de/oci-community/images/zendis/nginx:1.26.3

COPY --from=build /app/dist /usr/share/nginx/html/ga/demo-map/
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
