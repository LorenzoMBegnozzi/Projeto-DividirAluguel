FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Chave do MapTiler (mapas e busca de endereço). Vem do .env do ambiente via docker-compose;
# vazia = usa o OpenStreetMap gratuito. É pública (vai para o navegador); proteja no painel do MapTiler.
ARG VITE_MAPTILER_KEY=""
ENV VITE_MAPTILER_KEY=$VITE_MAPTILER_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
