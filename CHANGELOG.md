# Changelog

All notable changes to this repository are documented in this file.

## 2026-07-08

### Added
- Added a storefront product options utility to consistently sort Paper/Format options and derive valid format values for a selected paper type.

### Changed
- Updated product action selectors (desktop and mobile) to:
  - show options in a deterministic Paper then Format order.
  - filter format choices based on the selected paper option.
  - automatically adjust the selected format when a paper selection no longer supports the current format.
- Extended admin offering-set application input handling to support optional `digital_price` and `digital_price_currency`.
- Updated the offering-set workflow to apply explicit digital variant pricing when provided.

### Version
- Bumped `@dtc/backend` from `0.0.1` to `0.0.2`.
- Bumped `@dtc/storefront` from `1.0.3` to `1.0.4`.
