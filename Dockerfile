FROM node:20 AS build

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install --global pnpm && pnpm install --frozen-lockfile

COPY . .

COPY .env ./

RUN pnpm run build

FROM nginxinc/nginx-unprivileged:alpine

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./

COPY node_modules/leaflet/dist/images ./

ARG APP_UID=1001
ARG APP_GID=1001

RUN addgroup -g ${APP_GID} appgroup || echo "Group already exists" && \
    adduser -u ${APP_UID} -G appgroup -s /bin/sh -D appuser || echo "User already exists"

USER ${APP_UID}

CMD ["nginx", "-g", "daemon off;"]