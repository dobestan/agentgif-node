/**
 * Configuration storage — ~/.config/agentgif/config.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "agentgif");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

interface Config {
  api_key?: string;
  username?: string;
  [key: string]: string | undefined;
}

export function loadConfig(): Config {
  if (existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as Config;
    } catch {
      return {};
    }
  }
  return {};
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function getApiKey(): string | undefined {
  return loadConfig().api_key;
}

export function saveCredentials(apiKey: string, username: string): void {
  const config = loadConfig();
  config.api_key = apiKey;
  config.username = username;
  saveConfig(config);
}

export function clearCredentials(): void {
  const config = loadConfig();
  delete config.api_key;
  delete config.username;
  saveConfig(config);
}
