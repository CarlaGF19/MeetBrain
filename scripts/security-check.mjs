import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockedPathPatterns = [
  /^\.env(?:\.|$)/i,
  /^data[\\/]/i,
  /meetbrain\.sqlite$/i,
  /\.sqlite(?:3)?$/i,
  /\.db$/i,
];
const secretPatterns = [
  /GEMINI_API_KEY\s*=\s*["']?[A-Za-z0-9_\-]{20,}/i,
  /SMTP_PASS\s*=\s*["']?.{8,}/i,
  /AIza[0-9A-Za-z_\-]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  cwd: root,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const failures = [];

for (const file of files) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized === ".env.example") continue;
  if (blockedPathPatterns.some((pattern) => pattern.test(normalized))) {
    failures.push(`${file}: ruta privada bloqueada`);
    continue;
  }

  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
  if (fs.statSync(fullPath).size > 1_000_000) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: posible secreto detectado`);
      break;
    }
  }
}

if (failures.length > 0) {
  console.error("Security check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Security check passed: no private data or obvious secrets detected.");
