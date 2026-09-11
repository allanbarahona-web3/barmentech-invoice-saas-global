# Translation convention

Use `useTranslations()` in client UI and add matching `es` and `en` values to `foundation.ts`. Keys are grouped by owning domain: `auth.*`, `common.*`, `shell.*`, and `<module>.*` (for example, `customers.form.*`). Keep message values UI-only; country packs, currencies, fiscal rules, and timezones are separate concerns. Add `pt` and `fr` by extending `supportedLocales`, `foundationMessages`, and the dictionary registry.

Use `formatNumber`, `formatCurrency(amount, currency, locale)`, `formatDate`, and `formatDateTime` from `@/lib/formatters`. Date helpers accept an explicit timezone; timestamps remain UTC and locale never selects a timezone.
