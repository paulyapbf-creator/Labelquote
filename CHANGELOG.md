# Changelog

All notable changes to LabelQuote are documented here.
Format: `## [version] - YYYY-MM-DD`

---

## [1.1.0] - 2026-10-04
### Added
- Multi-quantity quoting: one quote shows pricing for multiple qty tiers
- Quantity unit toggle: select tiers by pieces or by rolls
- Roll presets (1/2/5/10/25/50 rolls) convert to pcs via packing setting
- Build version stamping: version + git hash + build date shown in Settings
- Quote form starts with no quantities pre-selected

### Fixed
- Old saved quotes (pre-multi-qty) auto-migrated to new breakdowns[] format
- Railway build failure: Node >=20 requirement added for vite-plugin-pwa

---

## [1.0.0] - 2026-09-01
### Added
- Initial release
- Quote form: size, shape, material, full-color, finishing, roll specs
- Multi-quote management with status tracking (draft/sent/accepted/rejected)
- PDF generation with company branding
- Pricing settings: RM/m² rates, shape multipliers, qty break tiers
- Optional fixed fees: setup, die-cut, min order (with toggles)
- PWA support for mobile installation
- Company info editable in-app
- Live price estimate while filling the form
- Quote list with search, filter, and stats bar
