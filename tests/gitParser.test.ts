import { describe, it, expect } from 'vitest';
import { parseGitLog, snapshotsToCompactJson } from '../src/data/gitParser.ts';

describe('Git Log Parser', () => {
  const sampleLog = `
COMMIT:f3a12b4|Alice|2026-11-01 10:00:00 +0000|Initial commit
10\t0\tREADME.md
50\t0\tsrc/main.ts

COMMIT:b8c9d0e|Bob|2026-11-02 12:00:00 +0000|Add utility functions
20\t5\tsrc/main.ts
30\t0\tsrc/utils.ts
`;

  it('correctly parses commits and line accumulations', () => {
    const snapshots = parseGitLog(sampleLog);
    expect(snapshots.length).toBe(2);

    const c1 = snapshots[0];
    expect(c1.hash).toBe('f3a12b4');
    expect(c1.author).toBe('Alice');
    expect(c1.files.get('README.md')?.lines).toBe(10);
    expect(c1.files.get('src/main.ts')?.lines).toBe(50);

    const c2 = snapshots[1];
    expect(c2.hash).toBe('b8c9d0e');
    expect(c2.author).toBe('Bob');
    // 50 + 20 - 5 = 65 lines
    expect(c2.files.get('src/main.ts')?.lines).toBe(65);
    expect(c2.files.get('src/utils.ts')?.lines).toBe(30);
  });

  it('converts snapshots to compact serializable JSON', () => {
    const snapshots = parseGitLog(sampleLog);
    const compact = snapshotsToCompactJson(snapshots);
    expect(compact.commits.length).toBe(2);
    expect(compact.commits[1].files['src/main.ts']).toBe(65);
  });
});
