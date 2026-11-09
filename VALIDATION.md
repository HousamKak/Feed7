# FEED7 verification

Release checked on 10 November 2026.

- Nine authored camera stops with curved transitions, an instanced kinetic gallery, generated artwork and material textures, ambient animation pause, and reduced-motion behavior.
- The Pages production build passes. Browser QA passed all nine desktop and mobile views, generated asset loading, animation and exact pause, WhatsApp brief preparation, project-subpath navigation, and checks for missing resources and runtime errors.
- All eight API integration tests pass, including authentication, portal isolation, SQLite persistence, and migration from five to nine chapters without losing editorial edits.
- The full application production build passes. The final browser regression passed; it covers requests, admin review, client updates, CMS, responsive bounds, and WebGL fallback.
- GitHub Actions successfully published the site: [deployment run](https://github.com/HousamKak/Feed7/actions/runs/42714863422). Browser QA also passed against the live URL, https://housamkak.github.io/Feed7/. The public verification report is in `docs/live-verification.json`.
- The public Pages site prepares WhatsApp briefs. The Node/SQLite admin, CMS, and private portal require a persistent Node host and are included in this repository.
- Generated asset originals are in `assets/source`, optimized WebP files in `public/generated`, and exact prompts in `assets/image-prompts.json`.
- The refreshed native Blockforge export includes all nine camera stops and the new installations. Its 102 meshes and 534,666 triangles were independently saved and reloaded through the actual Blockforge engine. `studio/manifest.json` records the matching source and output checksums, normalized to LF newlines.

Browser screenshots and local performance measurements are written to the ignored `artifacts/` directory. A controlled headless Chromium comparison measured approximately 15 fps before optimization and 60 fps afterward. Measurements are preserved in `docs/performance.json`. Performance varies by device.
