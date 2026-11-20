# @entirius/storefront-sdk

The contract between the Entirius storefront's core and its themes: the types of what each part of a theme
receives, the hooks the core lends, the translator and price formatting, `Media`, `RichText`, `Link`, and sample
data of every model (`/mocks`).

A theme depends on it at the same version as `@entirius/theme-default` and `@entirius/theme-cli`; all three are
installed by `pnpm create @entirius/theme`.

- [Building a theme](https://github.com/entirius/entirius-pwa-storefront/blob/develop/docs/themes/guide.md)
- [The theme contract](https://github.com/entirius/entirius-pwa-storefront/blob/develop/docs/themes/contract.md): every entry point and what each part receives

License: MPL-2.0.
