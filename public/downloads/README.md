# Release assets

This repository contains the website source only. Firmware binaries and firmware source archives are distributed separately by the maintainer.

For a complete production deployment, copy the maintained release assets into this directory **before** running `npm run build`:

- The three parts listed in `src/release.json` (preserve their names).
- `griv-v1-source.zip` — corresponding firmware source and verification records.
- `LICENSE.txt` — the license shipped with the firmware source.

The browser validates SHA-256 and reconstructs the original `fwdc248b.bin`. Never flash an individual part.

These release assets are intentionally ignored by Git. A source-only build can preview the interface; firmware download requires the separately maintained assets.
