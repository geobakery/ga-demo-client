FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install --global pnpm && pnpm install --frozen-lockfile

COPY . .

COPY .env ./

RUN pnpm run build

FROM nginxinc/nginx-unprivileged:alpine

WORKDIR /usr/share/nginx/html/ga-client/

COPY --from=build /app/dist ./

COPY ./default.conf /etc/nginx/conf.d/default.conf

ARG APP_UID=1001
ARG APP_GID=1001

RUN addgroup -g ${APP_GID} appgroup || echo "Group already exists" && \
    adduser -u ${APP_UID} -G appgroup -s /bin/sh -D appuser || echo "User already exists"

USER ${APP_UID}

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]