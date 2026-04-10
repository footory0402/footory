import { readAutomationRegistry } from "./automation-registry.mjs";

const registry = await readAutomationRegistry();

console.log(`Footory automation registry (${registry.updatedAt})`);
console.log("");

console.log("Agents");
for (const agent of registry.agents) {
  console.log(`- ${agent.id} [${agent.tier}]`);
  console.log(`  ${agent.summary}`);
  console.log(`  prompt: ${agent.promptPath}`);
}

console.log("");
console.log("Skills");
for (const skill of registry.skills) {
  console.log(`- ${skill.id} (${skill.pluginId})`);
  console.log(`  ${skill.summary}`);
  console.log(`  skill: ${skill.skillPath}`);
}

console.log("");
console.log("Plugins");
for (const plugin of registry.plugins) {
  console.log(`- ${plugin.id}`);
  console.log(`  ${plugin.summary}`);
  console.log(`  manifest: ${plugin.pluginPath}`);
}
