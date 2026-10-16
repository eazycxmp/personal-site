// Builds public/build-your-empire/index.html from shell.html and the source files in src/ (joined in ORDER.txt order).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const order = readFileSync(join(here, 'src/ORDER.txt'), 'utf8').split('\n').filter(Boolean);
const code = order.map(f => readFileSync(join(here, 'src', f), 'utf8')).join('');
const html = readFileSync(join(here, 'shell.html'), 'utf8').replace('<!--GAME-SCRIPT-->\n', code);
const out = join(here, '../../public/build-your-empire/index.html');
writeFileSync(out, html);
// a syntax check of the game module before anything ships
const tmp = join(process.env.TMPDIR || '/tmp', 'bye_check.mjs'); writeFileSync(tmp, code);
execFileSync(process.execPath, ['--check', tmp], {stdio:'inherit'});
console.log(`built ${out} from ${order.length} files, ${code.split('\n').length} lines; syntax OK`);
