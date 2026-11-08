import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function releaseNotes(history, version) {
  const lines = history.split(/\r?\n/);
  const sections = lines.flatMap((line, index) => line.startsWith('## ') ? [index] : []);
  const matches = sections.filter(index => lines[index].startsWith(`## [${version}] - `));
  if (matches.length !== 1) throw new Error(`修改历史必须包含唯一的 ${version} 版本章节`);

  const [start] = matches;
  const end = sections[sections.indexOf(start) + 1];
  const notes = lines.slice(start, end).join('\n').trimEnd();
  const entries = notes.split('\n').filter(line => line.startsWith('- '));
  if (!entries.length || entries.some(line => !/\p{Script=Han}/u.test(line))) {
    throw new Error(`修改历史 ${version} 必须包含中文条目`);
  }
  return `${notes}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const history = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  process.stdout.write(releaseNotes(history, process.argv[2]));
}
