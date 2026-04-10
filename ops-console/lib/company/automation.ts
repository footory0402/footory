export type AutomationAgentTier = "core" | "optional";

export interface AutomationAgentRecord {
  id: string;
  name: string;
  title: string;
  tier: AutomationAgentTier;
  summary: string;
  responsibilities: string[];
  mustRead: string[];
  mustNot: string[];
  typicalPrompts: string[];
  promptPath: string;
}

export interface AutomationSkillRecord {
  id: string;
  name: string;
  pluginId: string;
  summary: string;
  skillPath: string;
  whenToUse: string[];
  outputs: string[];
  defaultPrompt: string;
}

export interface AutomationPluginRecord {
  id: string;
  displayName: string;
  summary: string;
  pluginPath: string;
  marketplacePath: string;
  skillIds: string[];
  agentRegistryPath: string;
  commands: string[];
}

export interface AutomationCatalog {
  updatedAt: string;
  agents: AutomationAgentRecord[];
  skills: AutomationSkillRecord[];
  plugins: AutomationPluginRecord[];
}
