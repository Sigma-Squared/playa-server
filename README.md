# Deno HTTP Server

Simple TypeScript HTTP server running on Deno and packaged with Docker. All application code lives under `src/`.

## Configuration

Media extensions are defined in `config/media.yml`. At runtime the app looks for `/config/media.yml` (typical Unraid volume mount), falling back to the repo copy if it is available.

## Local development

```bash
deno task dev
```

## Docker

Build image:

```bash
docker build -t deno-playa .
```

Run container:

```bash
docker run -p 4236:4236 deno-playa
```

Visit `http://localhost:4236` to see JSON response (or pass `-e PORT=8080` when running the container to change the port).
