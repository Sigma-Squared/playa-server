FROM denoland/deno:debian-1.44.1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY appdata /appdata.defaults
WORKDIR /app
COPY deno.json ./
COPY src ./src
RUN deno cache src/main.ts
VOLUME ["/appdata", "/media"]
EXPOSE 4236
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run=ffmpeg,ffprobe", "src/main.ts"]
