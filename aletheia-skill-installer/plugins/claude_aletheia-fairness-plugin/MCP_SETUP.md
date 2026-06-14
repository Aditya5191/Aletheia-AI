# Aletheia Plugin Setup

The Aletheia Fairness Auditor plugin is now fully compliant with the official Claude Code plugin architecture!

### Zero-Configuration
Because this plugin includes a `.claude-plugin/plugin.json` and `.mcp.json`, the sandbox MCP server is **automatically registered and booted** when the plugin is loaded.

### Using the Plugin
If you installed the plugin to your Claude Code skills directory (`~/.claude/skills/`), it will be loaded automatically on your next session.

If you installed it to a local folder, you can load it into your current session by running:
`claude --plugin-dir /path/to/your/installation`

### Available Skills
You can now invoke the individual LangGraph agents as native Claude Code skills!
- `/aletheia:auditor` (Main Workflow)
- `/aletheia:data-surveyor`
- `/aletheia:fairness-adjudicator`
- `/aletheia:mitigation-agent`
- `/aletheia:report-compiler`
