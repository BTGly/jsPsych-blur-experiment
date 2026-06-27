# Upload API

This service receives one ZIP package at the end of each jsPsych session, stores it on disk, and records an index row in SQLite.

## Runtime Layout

```text
/opt/blur-exp/
  app/
  data/experiment.sqlite3
  storage/subjects/
  docker-compose.yml
  .env
```

The `.env` file must define `UPLOAD_TOKEN`. Do not commit it.

## Deploy

```bash
cd /opt/blur-exp
docker compose build upload-api
docker compose up -d upload-api
curl http://127.0.0.1:8000/health
```

The container binds only to `127.0.0.1:8000`; expose it through Nginx or Caddy.

## Nginx Route

```nginx
server {
    listen 80;
    server_name exp-api.cognitive-testing.cn;
    client_max_body_size 50M;

    location /health {
        proxy_pass http://127.0.0.1:8000;
    }

    location /api/upload-session {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

After DNS points `exp-api.cognitive-testing.cn` to the server, enable HTTPS with Certbot.
