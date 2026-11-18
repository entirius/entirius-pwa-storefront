# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Header search reads the products of matrix `search/` in the shape of `products/` (matrix 5.0): the row reuses the
  catalog's product normalizer, price and thumb instead of its own mapping. Breaking: needs matrix 5.0 or later; on
  4.x the search rows show no prices and placeholder pictures.
- Typefaces moved from the root layout to `_CONFIG/fonts.ts` (`next/font`): only the faces declared there are built
  and preloaded, so a client font no longer comes with the template's Inter and Lexend Deca (208 kB) and gets a
  preload and a metric-matched fallback face. Headings without a face of their own take the text face. Breaking:
  every `_CONFIG/` needs the file; `cp _CONFIG.example/fonts.ts _CONFIG/` keeps the default look.

### Added

- Back-in-stock alerts: with the channel's `API_STOCK_ALERTS_KEY` a sold-out size can be selected and the product
  page offers "Tell me when it is back" (e-mail, consent, honeypot) for that SKU; a saved request stays shown as saved
  after a reload, "Notify me" in the phone buy bar scrolls to the form, and `/stock-alert/cancel?token=` cancels a
  request from the mail link. Without the key the product page is unchanged.
