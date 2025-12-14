# Deno HTTP Server

Simple TypeScript HTTP server running on Deno and packaged with Docker. All application code lives under `src/`.

## Configuration

All runtime settings live in `config/config.yml`. In production the server first looks for `/config/config.yml` (e.g., mounted inside a container) and falls back to the copy in the repo. The file defines the HTTP port, version string, site metadata, feature toggles, and the list of supported media file extensions.

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
docker run -p 80:80 deno-playa
```

Visit `http://localhost:80` to see JSON response. Update `config/config.yml` if you need to expose a different port or change other server metadata.

### API

- `GET /` – simple status payload.
- `GET /api/playa/v2/version` – returns the server version from `config/config.yml`.
