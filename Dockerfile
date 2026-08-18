FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Where the built site will be served, origin and path together. Left unset it
# is this site's own host at the root of it; a deployment putting the tool
# under a path — one of several on a shared host — passes that address here and
# every asset, route, canonical and sitemap entry is written under it:
#   docker build --build-arg SITE_URL=https://example.org/vcl/ .
ARG SITE_URL=
ENV SITE_URL=$SITE_URL

RUN npm run build

FROM joseluisq/static-web-server:2-alpine
# The build stays here, read-only. The entrypoint copies it to SERVER_ROOT,
# which is a tmpfs, so the analytics snippet can be put in the pages at startup
# without the image filesystem ever being writable.
COPY --from=builder /app/dist /app/dist
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=/public/index.html
# The build writes one file per address, so `/tutorial` is a directory here.
# Without this, static-web-server 308s it to `/tutorial/` — an address the
# sitemap, the internal links and the page's own canonical never use.
ENV SERVER_REDIRECT_TRAILING_SLASH=false
# Overridden by compose with PORT, so the deploy script can probe the same port in
# every deployment mode.
ENV SERVER_PORT=10103
EXPOSE 10103

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/local/bin/static-web-server"]
