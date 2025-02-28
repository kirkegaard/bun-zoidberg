FROM oven/bun:latest

WORKDIR /app

COPY package.json ./
COPY bun.lock ./
COPY index.ts ./

RUN bun install

EXPOSE 6666

ENTRYPOINT ["bun", "start"]
