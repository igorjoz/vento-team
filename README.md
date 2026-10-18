# vento-team

Uruchomienie lokalne w Dockerze:

```sh
docker compose up -d --build
```

Strona: http://localhost:8080

Zatrzymanie:

```sh
docker compose down
```

Budowanie lokalne: `npm ci && npm run build` (Node.js 22.12+). Warianty obrazów
AVIF/WebP powstają automatycznie przed buildem; oryginały pozostają bez zmian.

Testy, pomiary, konfiguracja CSP i instrukcja publikacji na Hostingerze:
[DEPLOYMENT.md](DEPLOYMENT.md). Wyniki przed/po: [PERFORMANCE.md](PERFORMANCE.md).
Pierwotny przegląd: [AUDIT.md](AUDIT.md).
