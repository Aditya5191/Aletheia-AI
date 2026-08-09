#!/usr/bin/env node

import { select, input, confirm } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── UI Primitives ────────────────────────────────────────────────────────────

const WIDTH = 60;

function line(char = '-') {
  return char.repeat(WIDTH);
}

function centered(text) {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function header() {
  console.log('');
  console.log(chalk.cyan(line('─')));
  console.log(chalk.cyan.bold(centered('Aletheia Fairness Auditor')));
  console.log(chalk.dim(centered('Plugin Installer  v2.0.3')));
  console.log(chalk.cyan(line('─')));
  console.log('');
}

function section(title) {
  console.log('');
  console.log(chalk.cyan('  ' + title));
  console.log(chalk.dim('  ' + '─'.repeat(title.length)));
}

function step(num, total, text) {
  const badge = chalk.bgCyan.black(` ${num}/${total} `);
  console.log(`\n  ${badge}  ${chalk.white(text)}`);
}

function success(text) {
  console.log('\n  ' + chalk.green('[ done ]') + '  ' + chalk.white(text));
}

function info(label, value) {
  console.log('  ' + chalk.dim(label.padEnd(14)) + chalk.white(value));
}

function warn(text) {
  console.log('\n  ' + chalk.yellow('[ note ]') + '  ' + chalk.dim(text));
}

function error(text) {
  console.log('\n  ' + chalk.red('[ error ]') + '  ' + chalk.white(text));
}

function nextSteps(steps) {
  console.log('');
  console.log(chalk.cyan('  Next steps'));
  console.log(chalk.dim('  ' + '─'.repeat(10)));
  steps.forEach((s, i) => {
    console.log(`  ${chalk.dim(`${i + 1}.`)} ${chalk.white(s)}`);
  });
  console.log('');
}

function footer() {
  console.log(chalk.cyan(line('─')));
  console.log(chalk.dim(centered('Documentation: github.com/Aditya5191/Aletheia-AI')));
  console.log(chalk.cyan(line('─')));
  console.log('');
}

// ─── Zip Builders ────────────────────────────────────────────────────────────

const EXCLUDE = ['__pycache__', '.pyc', 'plan.md'];

function walkIntoZip(zip, dir, zipBase) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDE.some(x => entry.name === x || entry.name.endsWith(x))) continue;
    if (entry.isDirectory()) {
      walkIntoZip(zip, fullPath, `${zipBase}/${entry.name}`);
    } else {
      zip.addFile(`${zipBase}/${entry.name}`, fs.readFileSync(fullPath));
    }
  }
}

function buildClaudeZip(sourceFolder, outputZipPath, absoluteInstallPath) {
  const zip = new AdmZip();
  const ROOT = 'aletheia-fairness-plugin';
  walkIntoZip(zip, sourceFolder, ROOT);

  const mcpJsonEntry = zip.getEntry(`${ROOT}/.mcp.json`);
  if (mcpJsonEntry && absoluteInstallPath) {
    const serverScriptPath = path.join(absoluteInstallPath, 'mcp_sandbox', 'boot.py');
    const mcpConfig = {
      mcpServers: {
        sandbox: { command: 'python', args: [serverScriptPath] },
      },
    };
    zip.updateFile(mcpJsonEntry, Buffer.from(JSON.stringify(mcpConfig, null, 2)));
  }

  zip.writeZip(outputZipPath);
}

function buildAntigravityZip(sourceFolder, outputZipPath) {
  const zip = new AdmZip();
  const ROOT = 'aletheia-fairness-auditor';
  walkIntoZip(zip, sourceFolder, ROOT);
  zip.writeZip(outputZipPath);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  header();

  // Platform selection
  const platform = await select({
    message: chalk.white('Select target platform'),
    choices: [
      {
        name:  'Claude Code   ' + chalk.dim('Import via Settings > Plugins'),
        value: 'claude',
      },
      {
        name:  'Antigravity   ' + chalk.dim('Auto-install to ~/.gemini/config/plugins/'),
        value: 'antigravity',
      },
      {
        name:  'Codex         ' + chalk.dim('Copy plugin + generate marketplace.json'),
        value: 'codex',
      },
      {
        name:  'IBM Bob       ' + chalk.dim('Auto-install to ~/.bob/ (Global) or ./.bob/ (Project)'),
        value: 'bob',
      },
    ],
  });

  const sourceFolder = path.join(__dirname, '..', 'plugins', `${platform}_aletheia-fairness-plugin`);

  if (!fs.existsSync(sourceFolder)) {
    error(`Plugin source not found: ${sourceFolder}`);
    process.exit(1);
  }

  // ── Claude ──────────────────────────────────────────────────────────────────
  if (platform === 'claude') {
    section('Claude Code Plugin');

    step(1, 3, 'Output location');
    const defaultOut = path.join(os.homedir(), 'Desktop', 'aletheia-fairness-plugin.zip');
    const outputZip = await input({
      message: chalk.dim('Save .zip to'),
      default: defaultOut,
    });
    const resolvedZip = path.resolve(outputZip);

    step(2, 3, 'Sandbox MCP path');
    const knowExtract = await confirm({
      message: chalk.dim('Do you know where you will extract the plugin? (sets absolute MCP paths)'),
      default: false,
    });

    let extractPath = null;
    if (knowExtract) {
      extractPath = path.resolve(await input({
        message: chalk.dim('Extract location'),
        default: path.join(os.homedir(), '.claude', 'plugins', 'aletheia-fairness-plugin'),
      }));
    }

    step(3, 3, 'Building archive');
    const spinner = ora({ text: 'Packaging plugin files...', color: 'cyan' }).start();
    try {
      buildClaudeZip(sourceFolder, resolvedZip, extractPath);
      spinner.succeed(chalk.white('Archive built successfully'));
    } catch (err) {
      spinner.fail(chalk.red('Build failed'));
      error(err.message);
      process.exit(1);
    }

    success('Plugin archive ready');
    console.log('');
    info('Output', resolvedZip);
    info('Platform', 'Claude Code');
    info('MCP paths', knowExtract ? 'Absolute' : 'Relative (default)');

    if (!knowExtract) {
      warn('Sandbox MCP uses a relative path. If Claude cannot locate the MCP server,\n               re-run this installer and specify the extract location.');
    }

    nextSteps([
      'Open Claude Code',
      'Go to Settings > Plugins > Install from file',
      'Select the .zip file listed above',
      'Restart Claude Code',
    ]);

  // ── Antigravity ─────────────────────────────────────────────────────────────
  } else if (platform === 'antigravity') {
    section('Antigravity Plugin');

    const defaultDest = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'aletheia-fairness-auditor');

    step(1, 2, 'Installation method');
    const installDirect = await confirm({
      message: chalk.dim(`Install directly to ${defaultDest}?`),
      default: true,
    });

    if (installDirect) {
      step(2, 2, 'Copying files');
      const spinner = ora({ text: 'Installing plugin...', color: 'cyan' }).start();
      try {
        fs.mkdirSync(path.dirname(defaultDest), { recursive: true });
        fs.cpSync(sourceFolder, defaultDest, { recursive: true });
        spinner.succeed(chalk.white('Plugin installed'));
      } catch (err) {
        spinner.fail(chalk.red('Installation failed'));
        error(err.message);
        process.exit(1);
      }

      success('Plugin installed');
      console.log('');
      info('Location', defaultDest);
      info('Skill name', 'aletheia-fairness-auditor');
      info('MCP server', path.join(defaultDest, 'mcps', 'sandbox', 'boot.py'));

      nextSteps([
        'Restart Antigravity',
        'The "aletheia-fairness-auditor" skill is now available in every session',
        'If the sandbox MCP is missing after restart, the skill will automatically fall back to native Python execution',
      ]);

    } else {
      step(2, 2, 'Building archive');
      const defaultOut = path.join(os.homedir(), 'Desktop', 'aletheia-fairness-auditor.zip');
      const outputZip = path.resolve(await input({
        message: chalk.dim('Save .zip to'),
        default: defaultOut,
      }));

      const spinner = ora({ text: 'Packaging plugin files...', color: 'cyan' }).start();
      try {
        buildAntigravityZip(sourceFolder, outputZip);
        spinner.succeed(chalk.white('Archive built successfully'));
      } catch (err) {
        spinner.fail(chalk.red('Build failed'));
        error(err.message);
        process.exit(1);
      }

      success('Plugin archive ready');
      console.log('');
      info('Output', outputZip);

      nextSteps([
        `Extract the archive into: ${defaultDest}`,
        'Restart Antigravity',
      ]);
    }

  // ── IBM Bob ─────────────────────────────────────────────────────────────────
  } else if (platform === 'bob') {
    section('IBM Bob Plugin');

    step(1, 3, 'Installation Scope');
    const isGlobal = await confirm({
      message: chalk.white('Install globally? ') + chalk.dim('(Global: ~/.bob/, Project: ./.bob/)'),
      default: true,
    });

    const bobDir = isGlobal 
      ? path.join(os.homedir(), '.bob')
      : path.join(process.cwd(), '.bob');

    const skillsDest = path.join(bobDir, 'skills');
    const mcpJsonDest = isGlobal 
      ? path.join(bobDir, 'settings', 'mcp.json') 
      : path.join(bobDir, 'mcp.json');

    // Ensure settings directory exists for global installs
    if (isGlobal) {
      fs.mkdirSync(path.dirname(mcpJsonDest), { recursive: true });
    }

    step(2, 3, 'Installing Skills & MCP Code');
    const spinner = ora({ text: 'Copying files...', color: 'cyan' }).start();
    try {
      const sourceSkills = path.join(sourceFolder, 'skills');
      fs.mkdirSync(skillsDest, { recursive: true });
      fs.cpSync(sourceSkills, skillsDest, { recursive: true });

      const mcpsDest = path.join(bobDir, 'mcps');
      fs.mkdirSync(mcpsDest, { recursive: true });
      fs.cpSync(path.join(sourceFolder, 'mcps'), mcpsDest, { recursive: true });

      spinner.succeed(chalk.white('Files copied'));
    } catch (err) {
      spinner.fail(chalk.red('Failed to copy files'));
      error(err.message);
      process.exit(1);
    }

    step(3, 3, 'Configuring MCP');
    const spinner2 = ora({ text: 'Updating mcp.json...', color: 'cyan' }).start();
    try {
      const sourceMcpPath = path.join(sourceFolder, '.bob', 'mcp.json');
      const sourceMcp = JSON.parse(fs.readFileSync(sourceMcpPath, 'utf8'));
      
      const mcpsDest = path.join(bobDir, 'mcps');
      const absoluteServerPath = path.join(mcpsDest, 'sandbox', 'boot.py');
      
      if (sourceMcp.mcpServers && sourceMcp.mcpServers['aletheia-sandbox']) {
        sourceMcp.mcpServers['aletheia-sandbox'].args = [absoluteServerPath];
        sourceMcp.mcpServers['aletheia-sandbox'].description = "Aletheia secure Docker execution sandbox for fairness auditing";
      }

      let targetMcp = { mcpServers: {} };
      if (fs.existsSync(mcpJsonDest)) {
        try {
          targetMcp = JSON.parse(fs.readFileSync(mcpJsonDest, 'utf8'));
          if (!targetMcp.mcpServers) targetMcp.mcpServers = {};
        } catch (e) {}
      }

      targetMcp.mcpServers = {
        ...targetMcp.mcpServers,
        ...(sourceMcp.mcpServers || {})
      };

      fs.writeFileSync(mcpJsonDest, JSON.stringify(targetMcp, null, 2));
      spinner2.succeed(chalk.white('mcp.json updated'));
    } catch (err) {
      spinner2.fail(chalk.red('Failed to update MCP'));
      error(err.message);
      process.exit(1);
    }
    
    success('Plugin installed');
    console.log('');
    info('Location', bobDir);
    info('Skill name', 'aletheia-fairness-auditor');
    info('MCP config', mcpJsonDest);

    nextSteps([
      'Restart IBM Bob',
      'Open Bob Settings > MCP and verify "aletheia-sandbox" is active',
      'The "aletheia-fairness-auditor" skill is now available in your chat',
    ]);

  // ── Codex ───────────────────────────────────────────────────────────────────
  } else if (platform === 'codex') {
    section('Codex Plugin');

    const defaultPluginsDir = path.join(process.cwd(), 'plugins');
    step(1, 3, 'Plugin destination');
    const pluginsDir = path.resolve(await input({
      message: chalk.dim('Repo plugins/ directory'),
      default: defaultPluginsDir,
    }));
    const pluginDest = path.join(pluginsDir, 'aletheia-fairness-auditor');

    step(2, 3, 'Copying plugin files');
    const copySpinner = ora({ text: 'Copying plugin...', color: 'cyan' }).start();
    try {
      fs.cpSync(sourceFolder, pluginDest, { recursive: true });
      copySpinner.succeed(chalk.white('Plugin copied'));
    } catch (err) {
      copySpinner.fail(chalk.red('Copy failed'));
      error(err.message);
      process.exit(1);
    }

    // Patch .mcp.json with the absolute path to the installed mcp_server.py
    // so Codex resolves it correctly regardless of working directory
    const mcpJsonPath = path.join(pluginDest, '.mcp.json');
    if (fs.existsSync(mcpJsonPath)) {
      try {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
        const serverKey = Object.keys(mcpConfig.mcp_servers || mcpConfig.mcpServers || {})[0];
        const serverBlock = (mcpConfig.mcp_servers || mcpConfig.mcpServers)?.[serverKey];
        if (serverBlock) {
          const absoluteServerPath = path.join(pluginDest, 'mcp_sandbox', 'boot.py');
          serverBlock.args = [absoluteServerPath];
          serverBlock.description = 'Aletheia secure Docker execution sandbox for fairness auditing';
          const rootKey = mcpConfig.mcp_servers ? 'mcp_servers' : 'mcpServers';
          mcpConfig[rootKey][serverKey] = serverBlock;
          fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
          console.log('  ' + chalk.green('[ done ]') + '  ' + chalk.white('MCP server path resolved to absolute: ' + absoluteServerPath));
        }
      } catch (_) {
        console.log('  ' + chalk.yellow('[ warn ]') + '  ' + chalk.dim('Could not patch .mcp.json — MCP path left as relative'));
      }
    }

    step(3, 3, 'Generating marketplace.json');
    const marketplaceDir = path.join(process.cwd(), '.agents', 'plugins');
    fs.mkdirSync(marketplaceDir, { recursive: true });
    const marketplacePath = path.join(marketplaceDir, 'marketplace.json');

    const marketplace = {
      name: 'aletheia-marketplace',
      interface: { displayName: 'Aletheia Fairness Auditor' },
      plugins: [
        {
          name: 'aletheia-fairness-auditor',
          source: { source: 'local', path: './plugins/aletheia-fairness-auditor' },
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
          category: 'Productivity',
        },
      ],
    };

    if (fs.existsSync(marketplacePath)) {
      const existing = JSON.parse(fs.readFileSync(marketplacePath, 'utf-8'));
      const alreadyAdded = existing.plugins?.some(p => p.name === 'aletheia-fairness-auditor');
      if (!alreadyAdded) {
        existing.plugins = [...(existing.plugins || []), marketplace.plugins[0]];
        fs.writeFileSync(marketplacePath, JSON.stringify(existing, null, 2));
        console.log('  ' + chalk.green('[ done ]') + '  ' + chalk.white('Added to existing marketplace'));
      } else {
        console.log('  ' + chalk.dim('[ skip ]') + '  ' + chalk.dim('Plugin already present in marketplace'));
      }
    } else {
      fs.writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2));
      console.log('  ' + chalk.green('[ done ]') + '  ' + chalk.white('Marketplace file created'));
    }

    success('Plugin installed');
    console.log('');
    info('Plugin location', pluginDest);
    info('Marketplace', marketplacePath);

    nextSteps([
      'Restart Codex',
      'Open the Plugins panel and select your local marketplace',
      'Install "Aletheia Fairness Auditor" from the list',
    ]);
  }

  footer();
}

main().catch(err => {
  error(err.message || String(err));
  process.exit(1);
});
