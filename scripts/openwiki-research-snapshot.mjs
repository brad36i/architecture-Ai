import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const snapshotDir = path.join(root, "openwiki", "research", "snapshots");
fs.mkdirSync(snapshotDir, { recursive: true });

function safeExec(cmd, args) {
  if (cmd === "git" && !fs.existsSync(path.join(root, ".git"))) {
    return "not a git repository in this local workspace";
  }

  try {
    return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim();
    return stderr || `command failed: ${cmd} ${args.join(" ")}`;
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function listFiles(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function countFiles(dir, suffixes) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
      count += countFiles(path.relative(root, rel), suffixes);
    } else if (suffixes.some((suffix) => entry.name.endsWith(suffix))) {
      count += 1;
    }
  }
  return count;
}

const rootPkg = readJson("package.json");
const webPkg = readJson("apps/web/package.json");
const apiPkg = readJson("apps/api/package.json");
const agentPkg = readJson("packages/agent/package.json");
const dbPkg = readJson("packages/db/package.json");
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const outFile = path.join(snapshotDir, `${stamp}.md`);

const content = `# Research Snapshot — ${now.toISOString()}

## Package summary

| Workspace | Package | Key dependencies |
| --- | --- | --- |
| root | ${rootPkg.name} | workspaces: ${(rootPkg.workspaces ?? []).join(", ")} |
| apps/web | ${webPkg.name} | next ${webPkg.dependencies?.next ?? "n/a"}, react ${webPkg.dependencies?.react ?? "n/a"} |
| apps/api | ${apiPkg.name} | express ${apiPkg.dependencies?.express ?? "n/a"}, multer ${apiPkg.dependencies?.multer ?? "n/a"} |
| packages/db | ${dbPkg.name} | better-sqlite3 ${dbPkg.dependencies?.["better-sqlite3"] ?? "n/a"} |
| packages/agent | ${agentPkg.name} | @langchain/openai ${agentPkg.dependencies?.["@langchain/openai"] ?? "n/a"} |

## File counts

| Area | TS/TSX files |
| --- | ---: |
| apps/web/src | ${countFiles("apps/web/src", [".ts", ".tsx"])} |
| apps/api/src | ${countFiles("apps/api/src", [".ts", ".tsx"])} |
| packages/db/src | ${countFiles("packages/db/src", [".ts", ".tsx"])} |
| packages/agent/src | ${countFiles("packages/agent/src", [".ts", ".tsx"])} |
| openwiki | ${countFiles("openwiki", [".md"])} markdown pages |

## Important source files

${[
  ...listFiles("apps/api/src"),
  ...listFiles("packages/db/src"),
  ...listFiles("packages/agent/src"),
].map((file) => `- ${file}`).join("\n")}

## Git / workspace state

\`\`\`text
${safeExec("git", ["status", "--short"])}
\`\`\`

## Suggested paper note

Use this snapshot as objective evidence of the repository structure and implementation state at the time of writing. Pair it with command outputs from typecheck/build/audit before making claims in the paper.
`;

fs.writeFileSync(outFile, content);
console.log(path.relative(root, outFile));
