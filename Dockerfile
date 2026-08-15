FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2-alpine
COPY --from=builder /app/dist /public
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=/public/index.html
# Overridden by compose with PORT, so deploy.sh can probe the same port in
# every deployment mode.
ENV SERVER_PORT=10811
EXPOSE 10811
