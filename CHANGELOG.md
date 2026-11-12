# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Back-in-stock alerts: with the channel's `API_STOCK_ALERTS_KEY` a sold-out size can be selected and the product
  page offers "Tell me when it is back" (e-mail, consent, honeypot) for that SKU; a saved request stays shown as saved
  after a reload, "Notify me" in the phone buy bar scrolls to the form, and `/stock-alert/cancel?token=` cancels a
  request from the mail link. Without the key the product page is unchanged.
