FROM node:20 AS build

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install --global pnpm && pnpm install --frozen-lockfile

COPY . .

COPY .env ./

RUN pnpm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY node_modules/leaflet/dist/images /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]