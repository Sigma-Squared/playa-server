# Deno HTTP Server

Simple TypeScript [Play'A VR Player](https://www.playavr.com/) server implementing their
[v2 API](https://github.com/Playa-vr/PLAYA-API-v2/blob/main/docs.md) running on Deno and packaged
with Docker. All application code lives under `src/`.

## Configuration

All runtime settings live in `appdata/config.yml` (baked into the image under `/appdata.defaults`
and expected at runtime in `/appdata/config.yml`). The file defines:

- HTTP port (default 4236)
- Playa client version
- Site metadata and feature toggles
- Supported media file extensions

## Local development

```bash
deno task dev
```

## Docker

```bash
docker run --rm -p 80:4236 -v <config folder>:/appdata -v <media folder>:/media ghcr.io/sigma-squared/playa-server:latest
```

Or, build locally:

```bash
docker build -t deno-playa .
```

Run container:

```bash
docker run --rm -p 80:4236 -v <config folder>:/appdata -v <media folder>:/media deno-playa
```

Visit `http://localhost:80` to see JSON response. Update `appdata/config.yml` if you need to expose
a different port or change other server metadata.

### Implements

- `GET /` – simple status payload.
- `GET /content/:id` – streams the video file for the given id.
- `GET /content/:id/thumbnail` – generates (if missing) and returns a thumbnail for the video.
- `GET /api/playa/v2/version` – returns the Playa client version from config.
- `GET /api/playa/v2/config` – returns the Playa configuration block.
- `GET /api/playa/v2/videos` – paginated list of videos (query params: `page-index`, `page-size`,
  `order`, `direction`).
- `GET /api/playa/v2/video/:id` – returns details for a single video.
