# FEED7 verification

Release checked on 10 November 2026.

- Nine authored camera stops with curved transitions, an instanced kinetic gallery, generated artwork and material textures, ambient animation pause, and reduced-motion behavior.
- The Pages production build passes. Browser QA passed all nine desktop and mobile views, generated asset loading, animation and exact pause, WhatsApp brief preparation, project-subpath navigation, and checks for missing resources and runtime errors.
- All eight API integration tests pass, including authentication, portal isolation, SQLite persistence, and migration from five to nine chapters without losing editorial edits.
- The full application production build passes. A final browser regression run is in progress; its script covers requests, admin review, client updates, CMS, responsive bounds, and WebGL fallback.
- `.github/workflows/pages.yml` tests and deploys `main` to https://housamkak.github.io/Feed7/ using GitHub Actions.
- The public Pages site prepares WhatsApp briefs. The Node/SQLite admin, CMS, and private portal require a persistent Node host and are included in this repository.
- Generated asset originals are in `assets/source`, optimized WebP files in `public/generated`, and exact prompts in `assets/image-prompts.json`.
- The native Blockforge snapshot in `studio/` predates the final nine-stop extension. Regenerate with `npm run studio:export`; its manifest records the corresponding source checksums.

Browser screenshots and local performance measurements are written to the ignored `artifacts/` directory. A controlled headless Chromium comparison measured approximately 15 fps before optimization and 60 fps afterward. This is a local comparison, not a guarantee for every device.
