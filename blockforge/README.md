# FEED7 native world source

This directory is the canonical Blockforge rebuild requested by the user.

The existing website and `studio/` files came from a Three.js-authored prototype. They are migration references, not the source for this rebuild. No Three.js geometry constructors belong in this directory.

The native pipeline is:

1. Author modular `blockforge-object/1` projects and typed world source in metres, Z up.
2. Bake upholstery with the engine's existing Blender cloth tools, record inputs and tool digests, and bring the resulting geometry back into the object source.
3. Compile hero and browser tiers through Blockforge's object compiler, with real material recipes and per-part attributes.
4. Assemble and validate the complete studio through the world compiler.
5. Render the compiled scene through Blockforge's Blender Cycles pipeline at final quality.
6. Publish browser exports as consumers of the engine output. The browser renderer does not author the models.

The local engine checkout is selected with `BLOCKFORGE_ROOT`, default `D:/dev/block game`. The source reuses the engine's existing studio builders and T marbouta production furniture and planting modules. Those projects are dependencies. Their files and client references are not modified or copied here.

Status: the local development site consumes the native room assembly from Blockforge worldc's validated hybrid artifact. The logo is a closed native crystal mesh with broad diagonal front cuts. The floor has actual recessed circuit channels, native inlays with distance UVs, and native light packets. The browser animates these compiled assets and a procedural green atmosphere configured in `world/atmosphere.json`. `?model=chair` inspects the production chair separately. `?prototype=1` retains the previous scene for comparison. Final Cycles delivery remains in progress. GitHub and Pages have not been updated.

The opening uses a small `bootstrap.json` while a worker downloads, decompresses and parses an immutable compressed world payload. Geometry, graphics and material preparation run behind the logo. Development rebuilds prepare the replacement scene before swapping canvases. The tour uses direct physical rendering, with intermediate multisampled HDR resolves disabled to avoid the reported black frames. Smoke and circuit animations respect pause and reduced motion.

Rebuild the current native world:

```powershell
npm run native:build
npm run native:world
npm run native:save
npm run test:native-world
```

`world/design.json` holds dimensions, palette and zones. `world/architecture.mjs`, `recording.mjs` and `lounge.mjs` are the modular world source. The camera route lives beside them. `tools/build-world.mjs` assembles the source and compiles the generated `worlds/main.world.json` through the actual engine compiler, keeping its manifests, source maps, losses and validation report under `artifacts/native/worldc/`.

`artifacts/native/feed7-native.save.json` is the native engine save. The web renderer is a consumer of the compiler output, not the author of the room geometry. The existing draft pressure-pillow bakes in `bakes/` are retained as early experiments; the current chairs use the developed production upholstery bakes instead.

Upstream engine and production dependency source stays outside this repository. The compiled FEED7 browser delivery is versioned for GitHub Pages, which now serves the native studio. Rebuilding authoring assets requires the local engine checkout; the Pages workflow consumes the committed browser delivery.

Before entry, `src/studio-preparation.js` uploads material textures, exercises the real camera draws, builds cached shadows and waits for the GPU queue. The opening remains visible during this work. Tour controls unlock only when preparation finishes. The transition regression checks buffers, textures and shader counts across stops 3, 4 and 5 in both directions.

`npm run native:optimize` generates device-specific deliveries with the engine's Meshopt simplifier. Crystal identity meshes and the engraved floor retain their full geometry. Other meshes use explicit desktop and mobile budgets; complete native leaf blades are thinned by distribution. Positions, normals and UVs are compacted together. Generated assets under `public/optimized` and `public/mobile`, compressed bootstraps and their referenced world payloads are the browser release. First-scene readiness includes the lighting environment, fonts and a GPU fence. The tour unlocks after the remaining scene is prepared. Opening lights stay in the scene at zero intensity during the studio tour to keep shader variants stable.
