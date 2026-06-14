#!/usr/bin/env node

import { select, input } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=========================================");
  console.log("   Aletheia Fairness Auditor Installer   ");
  console.log("=========================================\n");

  const platform = await select({
    message: 'Which AI IDE are you installing this plugin for?',
    choices: [
      {
        name: 'Claude Desktop / Claude Code',
        value: 'claude',
        description: 'Installs the Claude Fairness Plugin',
      },
      {
        name: 'Cursor / Codex',
        value: 'codex',
        description: 'Installs the Codex Fairness Plugin',
      },
      {
        name: 'Antigravity',
        value: 'antigravity',
        description: 'Installs the native Antigravity Fairness Plugin',
      },
    ],
  });

  let defaultDest = `./${platform}_aletheia-fairness-plugin`;
  if (platform === 'claude') {
    defaultDest = path.join(os.homedir(), '.claude', 'skills', 'aletheia');
  }

  const destPath = await input({
    message: 'Where should we install the plugin folder? (Provide absolute or relative path)',
    default: defaultDest
  });

  const sourceFolder = path.join(__dirname, '..', 'plugins', `${platform}_aletheia-fairness-plugin`);
  const resolvedDest = path.resolve(destPath);

  console.log(`\nCopying plugin from ${sourceFolder} to ${resolvedDest}...`);

  try {
    fs.cpSync(sourceFolder, resolvedDest, { recursive: true });
    
    // Dynamically write .mcp.json with absolute paths to ensure Claude Code finds it
    if (platform === 'claude') {
      const mcpJsonPath = path.join(resolvedDest, '.mcp.json');
      const serverScriptPath = path.join(resolvedDest, 'mcp_sandbox', 'mcp_server.py');
      const mcpConfig = {
        "mcpServers": {
          "sandbox": {
            "command": "python",
            "args": [serverScriptPath]
          }
        }
      };
      fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
    }
    
    console.log("\n✅ Plugin successfully installed!");
    console.log("\n⚠️ IMPORTANT: To safely execute the audits, you must configure the bundled Sandbox MCP.");
    
    const setupPath = path.join(resolvedDest, 'MCP_SETUP.md');
    console.log(`Please read the setup guide at: ${setupPath}`);
    
    console.log("\nYou can now open your IDE and ask your AI assistant to 'run a fairness audit on my dataset'.");
  } catch (error) {
    console.error("\n❌ Failed to copy the plugin folder:");
    console.error(error.message);
  }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
