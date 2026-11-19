/**
 * Git Log Parser: Transforms raw git log --numstat output into sequential commit snapshots.
 */

export interface FileState {
  path: string;
  lines: number;
  lastModifiedCommit: string;
}

export interface CommitSnapshot {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: Map<string, FileState>;
  changedFiles: string[];
  additions: number;
  deletions: number;
}

export interface CompactRepoHistory {
  commits: {
    hash: string;
    author: string;
    date: string;
    message: string;
    additions: number;
    deletions: number;
    changedFiles: string[];
    files: Record<string, number>;
  }[];
}

export function parseGitLog(rawLog: string): CommitSnapshot[] {
  const lines = rawLog.split(/\r?\n/);
  const snapshots: CommitSnapshot[] = [];
  const activeFiles = new Map<string, FileState>();

  let currentCommit: Partial<CommitSnapshot> | null = null;
  let commitAdditions = 0;
  let commitDeletions = 0;
  let changedInCommit: string[] = [];

  function finalizeCommit() {
    if (currentCommit && currentCommit.hash) {
      // Clone snapshot of files at this commit
      const filesClone = new Map<string, FileState>();
      for (const [k, v] of activeFiles.entries()) {
        if (v.lines > 0) {
          filesClone.set(k, { ...v });
        }
      }

      snapshots.push({
        hash: currentCommit.hash,
        author: currentCommit.author || "Unknown",
        date: currentCommit.date || "",
        message: currentCommit.message || "",
        files: filesClone,
        changedFiles: [...changedInCommit],
        additions: commitAdditions,
        deletions: commitDeletions,
      });
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("COMMIT:")) {
      finalizeCommit();
      const meta = trimmed.substring(7).split("|");
      currentCommit = {
        hash: meta[0],
        author: meta[1] || "",
        date: meta[2] || "",
        message: meta.slice(3).join("|") || "",
      };
      commitAdditions = 0;
      commitDeletions = 0;
      changedInCommit = [];
      continue;
    }

    // Parse numstat line: <add>\t<del>\t<path>
    const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
    if (match && currentCommit) {
      const added = match[1] === "-" ? 0 : parseInt(match[1], 10);
      const deleted = match[2] === "-" ? 0 : parseInt(match[2], 10);
      const filePath = match[3];

      commitAdditions += added;
      commitDeletions += deleted;
      changedInCommit.push(filePath);

      const existing = activeFiles.get(filePath);
      const prevLines = existing ? existing.lines : 0;
      const newLines = Math.max(0, prevLines + added - deleted);

      if (newLines === 0) {
        activeFiles.delete(filePath);
      } else {
        activeFiles.set(filePath, {
          path: filePath,
          lines: newLines,
          lastModifiedCommit: currentCommit.hash || "",
        });
      }
    }
  }

  finalizeCommit();
  return snapshots;
}

export function snapshotsToCompactJson(snapshots: CommitSnapshot[]): CompactRepoHistory {
  return {
    commits: snapshots.map((s) => {
      const fileObj: Record<string, number> = {};
      for (const [k, v] of s.files.entries()) {
        fileObj[k] = v.lines;
      }
      return {
        hash: s.hash,
        author: s.author,
        date: s.date,
        message: s.message,
        additions: s.additions,
        deletions: s.deletions,
        changedFiles: s.changedFiles,
        files: fileObj,
      };
    }),
  };
}
