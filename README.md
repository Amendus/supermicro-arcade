# Supermicro Arcade — static snapshot for foxhaven.ai/supermicro

This is the page the Mac host was serving on 2026-11-04, frozen so it can sit on Cloudflare instead of a trycloudflare tunnel.

## Layout

Publish **this directory** so these URLs exist:

- `https://foxhaven.ai/supermicro/` → `index.html`
- `https://foxhaven.ai/supermicro/assets/embedded/…` → `assets/embedded/…`

Asset paths inside the files are already prefixed with `/supermicro/`. Do not strip that prefix.

## Rebuild

There is no webpack/vite step. The playable page is produced by the Node host, then snapshotted.

1. On the Mac, start the arcade host so `http://127.0.0.1:8816/` returns the live page.
2. From this folder:

```bash
python3 export-static.py
```

Output is this folder: `index.html` plus `assets/`. The script rewrites `/assets/…` to `/supermicro/assets/…` and adds `<base href="/supermicro/">`.

## What still needs the Mac

Static hosting will not run these. They 404 (or never connect) on foxhaven.ai:

- **Race online / rooms** — WebSocket `/ws`, plus `GET /api/rooms`. Scan-to-join will not open a room.
- **QR codes** — `GET /api/room-qr` and `GET /api/play-qr`. The code also asks `/health` for the public link. That health JSON is the Mac host.
- **Shared daily event scores** — `POST /api/start`, `POST /api/finish`, `GET /api/leaderboard`. Those boards live on the Mac, not in this snapshot.
- **The Node host itself** (`server.js`, room simulation, the 46 MB source HTML). This repo is the rendered page and its hashed assets, not the server.

Solo play (Just me, and the other arcade games once their scripts and images are in `assets/`) does not need the Mac. Multiplayer and the daily board do.
