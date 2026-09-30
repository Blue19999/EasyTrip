import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const assets = ['index.html', 'app.js', 'export.js', 'style.css', 'favicon.svg'];

await mkdir(output, { recursive: true });
await Promise.all(assets.map(name => copyFile(join(root, name), join(output, name))));
console.log(`Prepared ${assets.length} EasyTrip assets in dist/`);
