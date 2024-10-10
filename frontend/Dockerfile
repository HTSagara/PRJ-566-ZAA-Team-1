FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

################################################################################

# STAGE 1
FROM node:20.10.0-alpine3.19@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 AS build
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g expo
COPY --from=dependencies /app /app
COPY . .
# Build the site, creating /dist
RUN npx expo export -p web 

################################################################################

# STAGE 2
FROM nginx:1.27.0-alpine3.19@sha256:a45ee5d042aaa9e81e013f97ae40c3dda26fbe98f22b6251acdf28e579560d55 AS deploy
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=1 \
  CMD curl --fail localhost:80 || exit 1
