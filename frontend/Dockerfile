# ------ this Dockerfile is a set of instructions that tells Docker how to build an image
# ------ image: frozen, complete snapshot of the entire app; not running yet
# ------ container: image that is actually running; can run multiple containers with same image

# to run the frontend, need:
#    - docker build -t bb-frontend .
#    - docker run --name bb-frontend --rm -p 3000:3000 bb-frontend

# alternatively, use docker-compose.yml file to run the full-stack completely
#    - docker-compose up --build

# docker hub - cloud registry like github where u can push or pull image (sharing publicly/privately)

FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time, not runtime
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
