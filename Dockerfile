FROM denoland/deno:debian-1.44.1
WORKDIR /app
COPY deno.json ./
COPY src ./src
COPY config /config
RUN deno cache src/main.ts
EXPOSE 4236
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "src/main.ts"]
