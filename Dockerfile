FROM denoland/deno:debian-1.44.1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY config /config
WORKDIR /app
COPY deno.json ./
COPY src ./src
RUN deno cache src/main.ts
EXPOSE 4236
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-run=ffmpeg,ffprobe", "src/main.ts"]
