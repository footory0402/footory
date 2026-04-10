import fs from "node:fs/promises";
import { readAutomationRegistry, resolveFromRepo } from "./automation-registry.mjs";

const [kind, targetId] = process.argv.slice(2);

if (!kind || !targetId) {
  console.error("Usage: node scripts/use-automation.mjs <agent|skill|plugin> <id>");
  process.exit(1);
}

const registry = await readAutomationRegistry();

if (kind === "agent") {
  const agent = registry.agents.find((item) => item.id === targetId);
  if (!agent) {
    console.error(`Unknown agent: ${targetId}`);
    process.exit(1);
  }

  const content = await fs.readFile(resolveFromRepo(agent.promptPath), "utf8");
  console.log(content.trim());
  process.exit(0);
}

if (kind === "skill") {
  const skill = registry.skills.find((item) => item.id === targetId);
  if (!skill) {
    console.error(`Unknown skill: ${targetId}`);
    process.exit(1);
  }

  console.log(`${skill.name}`);
  console.log("");
  console.log(`summary: ${skill.summary}`);
  console.log(`path: ${skill.skillPath}`);
  console.log(`default prompt: ${skill.defaultPrompt}`);
  process.exit(0);
}

if (kind === "plugin") {
  const plugin = registry.plugins.find((item) => item.id === targetId);
  if (!plugin) {
    console.error(`Unknown plugin: ${targetId}`);
    process.exit(1);
  }

  const content = await fs.readFile(resolveFromRepo(plugin.pluginPath), "utf8");
  console.log(content.trim());
  process.exit(0);
}

console.error(`Unsupported kind: ${kind}`);
process.exit(1);
