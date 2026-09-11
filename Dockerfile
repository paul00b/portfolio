# --- build ------------------------------------------------------------------
# Node 22 : Vite 7 exige >= 20.19 ou >= 22.12.
FROM node:22-alpine AS build

WORKDIR /app

# Couche dépendances séparée : tant que le lockfile ne bouge pas, le npm ci
# est repris du cache et un rebuild ne recompile que le site.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- serve ------------------------------------------------------------------
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
