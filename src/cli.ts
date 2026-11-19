#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { parseGitLog, snapshotsToCompactJson } from './data/gitParser.ts';

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'parse';
  const targetDir = args[1] || '.';

  if (command !== 'parse') {
    console.log('Usage: npx chrono-git parse [path/to/repo] [output.json]');
    process.exit(1);
  }

  const outPath = args[2] || path.join(process.cwd(), 'repo-history.json');
  console.log(`[+] Parsing git log from: ${path.resolve(targetDir)}`);

  try {
    const rawLog = execSync('git log --numstat --reverse --pretty=format:"COMMIT:%H|%an|%ad|%s"', {
      cwd: targetDir,
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf-8',
    });

    const snapshots = parseGitLog(rawLog);
    const compact = snapshotsToCompactJson(snapshots);

    fs.writeFileSync(outPath, JSON.stringify(compact, null, 2), 'utf-8');
    console.log(`[✓] Extracted ${snapshots.length} commits across ${Object.keys(compact.commits[compact.commits.length - 1]?.files || {}).length} files.`);
    console.log(`[✓] Compact repo history saved to: ${outPath}`);
  } catch (err: any) {
    console.error(`[-] Failed to parse git repository: ${err.message}`);
    process.exit(1);
  }
}

main();
