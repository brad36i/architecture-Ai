# OpenWiki Maintenance

## When to update

Update `openwiki/` after:

- a new feature is implemented;
- API/database boundaries change;
- verification commands produce new evidence;
- an implementation decision changes the paper narrative.

## Manual update flow

```bash
npm run research:snapshot
npm run typecheck
npm run build
npm audit --omit=dev
```

Then update:

- `openwiki/research/implementation-log.md`;
- `openwiki/research/evidence-map.md`;
- relevant architecture pages.

## OpenWiki CLI flow

With provider credentials:

```bash
export OPENAI_API_KEY=...
# optional override; default is gpt-5.4-mini
export OPENWIKI_MODEL_ID=gpt-5.4-mini
npm run openwiki:update
```

OpenWiki's official quickstart says non-interactive runs require provider credentials in the environment or `~/.openwiki/.env`.

## GitHub Actions

`.github/workflows/openwiki-update.yml` is prepared but requires repository secrets before it can run successfully:

- `OPENAI_API_KEY` or another supported provider key;
- optionally `LANGSMITH_API_KEY`.
