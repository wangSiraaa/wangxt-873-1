# Trae Preflight

This folder is prepared for `wangxt-873-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18173
- API_PORT: 19173
- WEB_PORT: 20173
- DB_PORT: 21173
- REDIS_PORT: 22173

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
