import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const sections = ['Aluraya Studio — runtime JavaScript dependency notices\n'];
for (const [directory, entry] of Object.entries(lock.packages)) {
  if (!directory || entry.dev) continue;
  const files = await readdir(directory);
  const license = files.find((name) => /^licen[sc]e(?:\..*)?$/i.test(name));
  if (!license) throw new Error(`License file missing for ${directory}`);
  const text = await readFile(join(directory, license), 'utf8');
  sections.push(`${directory.replace('node_modules/', '')} ${entry.version}\n${text}`);
}
await writeFile('public/THIRD-PARTY-NOTICES.txt', sections.join('\n\n--------------------\n\n'));
console.log('Runtime JavaScript license notices collected.');
