# FEED7 / The virtual growth studio

A custom, real-time emerald studio with thirteen camera stops with a supplied-logo opening, circuit-road transition, studio assembly, and logo return, curved dolly transitions, a kinetic gallery, recording and digital-production zones, animated wall screens, an orbital light sculpture, and a reflective architectural floor. The supplied palette and agency brief are preserved in `src/content.js`.

## Public studio and GitHub Pages

The public site is deployed by `.github/workflows/pages.yml` from the `main` branch of [HousamKak/Feed7](https://github.com/HousamKak/Feed7) to [housamkak.github.io/Feed7](https://housamkak.github.io/Feed7/). GitHub Pages is configured to use GitHub Actions. Each push runs the API integration tests, builds with the repository subpath, uploads the Pages artifact, and deploys it.

```sh
npm run build:pages
```

Set `VITE_BASE_PATH=/Feed7/` when building for this repository. The workflow sets it automatically. Pages output is in `dist-pages/`, separate from the full application build in `dist/`.

GitHub Pages serves the complete 3D presentation, service search, concept imagery, and a working WhatsApp brief handoff. It cannot execute the Node/SQLite API. The public form explicitly prepares a WhatsApp message and never claims a request has been saved. The complete backend, private portal, admin, and CMS remain available through `npm run dev` or a persistent Node deployment.

## Generated artwork and motion

Four original assets were generated with the built-in image generation tool. Full-resolution originals are in `assets/source/`; the exact prompt set is in `assets/image-prompts.json`. Optimized WebP files consumed by the studio and work gallery are in `public/generated/`:

- `emerald-signal.webp` / chrome and emerald-glass orbital artwork, displayed in the digital lab, on a monitor, and in the concept gallery.
- `production-detail.webp` / editorial recording concept displayed above the creative floor and in the gallery. Generated imagery, not a photograph of an existing FEED7 facility.
- `basalt-floor.webp` / repeating architectural stone color/bump texture blended with the floor reflection.
- `emerald-acoustic.webp` / repeating woven material for upholstery, acoustic clouds, and fabric surfaces.

The studio includes separate kinetic installations: an instanced chrome ribbon installation, a lounge mobile, a procedural waveform wall, moving glass fins, floating data particles, traveling light accents, a gently floating dimensional 7, and the overhead orbital sculpture. Ambient pause freezes the scene; reduced motion removes ambient movement. No audio input is accessed.

The native studio uses separate optimized desktop and mobile deliveries. World downloads are approximately 2.28 MB on desktop and 1.04 MB on mobile, compared with the 6.14 MB full web artifact. The first scene stays covered until its environment lighting, fonts and GPU frame are ready. Geometry, textures, shader variants, bounds and cached shadows are prepared before tour entry. Mobile uses smaller textures, lighter glass and smoke, and a 30 fps cap. Desktop uses bounded drawing-buffer resolution and smaller refraction captures. Original prototype timings in docs/performance.json are historical, not measurements of this native revision.

## Run locally

Requires Node 22.13+ (uses built-in SQLite).

```sh
npm install
npm run dev
```

Open http://localhost:5173. For admin access, copy `.env.example` to `.env`, set a unique `ADMIN_PASSWORD` of at least 16 characters, and restart the server. Open `/admin`. No default admin password is provided.

```sh
npm test
npm run build
npm start
```

`npm start` serves the production build and the API together. Use HTTPS in production; production admin cookies require HTTPS. Set `PORT` as needed. This Node/SQLite backend needs a persistent Node host and disk; static-only hosting cannot run the request system. Back up `data/feed7.sqlite` with a SQLite-aware backup process, including WAL consistency. Protect the deployment and database directory from public access.

## Experience

- Thirteen chapters, controlled by native page scrolling, chapter navigation, or left/right arrow keys. The "Look around" control lets visitors drag and zoom through the studio with the editorial layer hidden.
- Custom studio architecture in `src/studio.js`; camera route in `src/camera-tour.js`. The Blockforge project at `D:/dev/block game` and its studio export/viewpoints were inspected as reference. This FEED7 space is a new authored environment with a working Blockforge export: `studio/feed7.save.json`, the editable build plan `studio/feed7.plan.json`, and `studio/camera-route.json`. The export was applied and independently reloaded through Blockforge's actual World, BuildExecutor, and Serializer. Its 102 meshes and 534,666 triangles are recorded in `studio/manifest.json`. The architectural meshes come from the web studio; canvas signage becomes vertex color, while animated screens, transparent glass, and mirror effects keep their richer web rendering.
- Detailed services, search, concept portfolio, about, FAQ, privacy, terms, and WhatsApp contact.
- Validated project briefs stored in SQLite. Every request receives a private bearer-link portal for status and team updates. Treat these links as confidential. They are not email-delivered; the visitor must save the link shown after submission.
- Authenticated admin inbox, client/project records, and editable service/chapter/FAQ content. Sessions use hashed tokens and HttpOnly SameSite cookies; public requests and login are rate-limited. Origin checks protect writes.
- Reduced-motion support, ambient pause, mobile layout, keyboard controls, and usable content when WebGL fails.

## Full backend deployment

The public contact handoff uses the number supplied in the brief, `+961 81 112 046`. To deploy the optional backend, set admin credentials, use HTTPS on a persistent Node host, and establish database backups. Real client case studies, team biographies, service pricing, and booking availability were not supplied; the work section labels its internal concepts explicitly. No automated booking, payment, or email delivery is claimed.

The client portal intentionally provides request tracking now; invoicing, file collaboration, and a full account-based client workspace can extend this foundation later.

## Blockforge authoring

The local studio now uses the native world codebase in [blockforge/README.md](blockforge/README.md). Its room and asset modules generate typed world source and mesh assets, compile through Blockforge worldc, and deliver the validated artifact to the browser. Run `npm run native:build`, `npm run native:world`, then `npm run native:save` to regenerate it. Production furniture and planting reuse the existing local engine modules. Compiled FEED7 browser deliveries are published through GitHub Actions. Upstream engine and production dependency source stays local. The logo and circuit geometry are native assets, with browser animation and a procedural smoke effect. Final Cycles delivery remains in progress.

The following export command is retained for the earlier prototype only:

Import `studio/feed7.save.json` into Blockforge to work with the studio geometry. To regenerate from the web scene, keep `npm run dev` running, set `BLOCKFORGE_ROOT` to your Blockforge checkout (defaults to `D:/dev/block game`), and run `npm run studio:export`. If Playwright's default browser is not installed, set `CHROME_EXECUTABLE` to an existing Chromium/Chrome binary. The exporter writes only inside this project's `studio/` directory; it does not alter the Blockforge checkout. The export is one-way: native edits are not automatically reflected back into the website's procedural source.

## Current visual revision

The supplied `logo1.jpg` and `logo2.jpg` are preserved in `assets/brand-source/`. Smooth vector geometry drives the opening mark, road transition, and closing loop. The dimensional 7 stays in the centre of the studio. Studio copy alternates sides with corresponding camera framing. Right-hand information panels use translucent forest-green glass.

`public/blockforge/` contains four verified CC0 material scans and a studio HDRI, imported through Blockforge's real material compiler by `scripts/import-blockforge-materials.mjs`. The materials manifest records source licences, URLs, and hashes. The interactive site remains a Three.js render. This material and lighting revision is not a finished photoreal or path-traced result.

The native snapshot in `studio/` is the earlier nine-stop export; it is retained as a verified baseline while the new sequence and photoreal pipeline are developed.

## Offline Cycles reference

A real Blockforge/Blender Cycles reference is saved in `assets/render-studies/recording-cycles.png` and published as `public/render-studies/recording-cycles.webp`. Its metadata records 128 samples at 1280 by 800 and a 9.6-second GPU render. The in-house work gallery includes this lighting study. It uses the studio geometry, scanned materials, soft area lights, HDRI, indirect light, and denoising. It is separate from interactive rendering, and the simplified furniture and equipment still need more modelling detail.

With the local Blockforge checkout and development server running, set `CHROME_EXECUTABLE` and run `node scripts/render-photoreal.mjs`. This exports the current web scene into Blockforge's Cycles scene format and invokes `tools/render-cycles/run.mjs`. The normal command respects the engine's render queue. The optional `--no-slot` flag bypasses its admission gate when explicitly requested, as it was for this reference.
