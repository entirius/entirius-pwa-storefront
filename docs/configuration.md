# Configuration

The storefront reads its configuration from JSON files in `_CONFIG/`, imported directly by the code.

## Config System

`_CONFIG/` is gitignored. `_CONFIG.example/` is the committed template.

```bash
cp -r _CONFIG.example _CONFIG
# app.config.json      → set API_BASE_URL (backend URL)
# channels.config.json → set CHANNEL_LABEL and API_CHECKOUT_KEY per channel
# countries.config.json → country → languages/currencies/channels mapping
```

Import configs directly: `import countries from "@/_CONFIG/countries.config.json"`. Config is type-checked at build time.

## Files

| File | Keys |
|---|---|
| `_CONFIG/app.config.json` | `API_BASE_URL` (backend URL), `DEBUG_MODE` (enables `_LOGGER` output) |
| `_CONFIG/channels.config.json` | per channel: `CHANNEL_LABEL`, `API_CHECKOUT_KEY` (checkout `x-api-key`) |
| `_CONFIG/countries.config.json` | per country: languages, currencies, channels + defaults |

The template ships the two channels of the reference dataset (`default-europe`, `default-local`);
replace `API_CHECKOUT_KEY` with the key issued by your backend for each channel.

## Config Variables

| File | Key | Purpose |
|------|-----|---------|
| `app.config.json` | `API_BASE_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `app.config.json` | `DEBUG_MODE` | Enables `_LOGGER` console output and DEBUG-only dev tools |
| `channels.config.json` | `{channel}.CHANNEL_LABEL` | Channel display name |
| `channels.config.json` | `{channel}.API_CHECKOUT_KEY` | Checkout API key per channel (`x-api-key`) |
| `countries.config.json` | `{country}.default_language` | Default language for country |
| `countries.config.json` | `{country}.default_currency` | Default currency for country |
| `countries.config.json` | `{country}.default_channel` | Default channel for country |
