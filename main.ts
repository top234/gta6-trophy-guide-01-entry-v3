// GTA VI trophy guide, version 3 (Node 22, standard library only): the guide
// is this directory's app/ folder, plain static files a browser opens at
// app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json.
// The program hands it in: it copies app/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library. Leave vendor/makefun-frontend.ts
// as it is: the scorer requires dossier.json to be byte for byte what its
// own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing; refusing to hand in a broken entry.');
}
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.') && statSync(join(shotsDir, name)).isFile()).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`Expected 3 or 4 screenshots, found ${shots.length}.`);
}
for (const shot of shots) {
  if (!/\.(png|jpe?g)$/i.test(shot)) {
    throw new Error(`Screenshot ${shot} is not a PNG or JPEG.`);
  }
  if (statSync(join(shotsDir, shot)).size > 262144) {
    throw new Error(`Screenshot ${shot} is over 256 KiB.`);
  }
}

// The output directory is only ever created and copied into, never removed:
// in the grader it is a mounted directory, and removing it fails the run.
mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
