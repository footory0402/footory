import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const registryPath = path.join(repoRoot, ".agents", "footory-automation.json");

export async function readAutomationRegistry() {
  const raw = await fs.readFile(registryPath, "utf8");
  return JSON.parse(raw);
}

export function resolveFromRepo(relativePath) {
  return path.join(repoRoot, relativePath);
}

export { repoRoot, registryPath };
