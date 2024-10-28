FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --global pnpm && pnpm install

COPY . .

RUN pnpm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY node_modules/leaflet/dist/images /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]