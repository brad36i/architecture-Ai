import fs from "node:fs";
import { spawnSync } from "node:child_process";

function loadRootEnv() {
  if (!fs.existsSync(".env")) return;

  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadRootEnv();

const mode = process.argv[2] ?? "chat";
const message = process.argv.slice(3).join(" ").trim();
const modelId = process.env.OPENWIKI_MODEL_ID || "gpt-5.4-mini";

process.env.OPENWIKI_PROVIDER ||= "openai";
process.env.OPENWIKI_MODEL_ID = modelId;

const openwikiArgs = [];
if (mode === "init") {
  openwikiArgs.push("--init");
} else if (mode === "update") {
  openwikiArgs.push("--update");
} else if (mode !== "chat") {
  console.error(`Unknown OpenWiki mode: ${mode}`);
  process.exit(1);
}

openwikiArgs.push("--modelId", modelId);
if (message) openwikiArgs.push(message);
if (mode !== "chat") openwikiArgs.push("--print");

const result = spawnSync(
  "npx",
  ["--yes", "--package", "openwiki@0.0.1", "openwiki", ...openwikiArgs],
  {
    stdio: "inherit",
    env: process.env,
  }
);

process.exit(result.status ?? 1);
