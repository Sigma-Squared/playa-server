FROM denoland/deno:debian-1.44.1
COPY config /config
WORKDIR /app
COPY deno.json ./
COPY src ./src
RUN deno cache src/main.ts
EXPOSE 4236
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "src/main.ts"]
