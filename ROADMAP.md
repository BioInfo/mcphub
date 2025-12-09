# MCPHub Roadmap

This document tracks planned features and MCP client support expansion.

## Current Support (v0.1.0)

| Tool | Config Path | Status |
|------|-------------|--------|
| Claude Code | `~/.claude/.mcp.json` | Supported |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | Supported |
| Roo Code | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` | Supported |

## Planned MCP Client Support

### Priority 1: High Adoption Tools

| Tool | Config Path | Schema | Notes |
|------|-------------|--------|-------|
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | Same as Claude Desktop | Codeium's AI IDE with Cascade |
| **Cursor** | `~/.cursor/mcp.json` (global) | Same as Claude Desktop | Popular AI-first code editor |
| | `.cursor/mcp.json` (project) | | Project-level configs supported |

### Priority 2: IDE Integrations

| Tool | Config Path | Schema | Notes |
|------|-------------|--------|-------|
| **JetBrains AI Assistant** | Settings UI + external | Standard MCP | IntelliJ, PyCharm, WebStorm, etc. |
| **Continue.dev** | `~/.continue/config.json` | Custom `mcpServers` section | Open-source AI assistant |
| **Zed** | TBD | TBD | Rust-based editor with AI features |

### Priority 3: Emerging Tools

| Tool | Status | Notes |
|------|--------|-------|
| **VS Code Copilot** | Monitoring | GitHub working on MCP support |
| **Cody (Sourcegraph)** | Monitoring | Code intelligence platform |
| **Tabnine** | Monitoring | AI code completion |
| **Amazon Q** | Monitoring | AWS AI assistant |

## Feature Roadmap

### v0.2.0 - Extended Client Support
- [ ] Add Windsurf config support (`~/.codeium/windsurf/mcp_config.json`)
- [ ] Add Cursor global config support (`~/.cursor/mcp.json`)
- [ ] Add Cursor project-level config detection (`.cursor/mcp.json`)
- [ ] UI to show which tools are detected/installed on system
- [ ] Handle tools with different config locations (Windows, Linux)

### v0.3.0 - Cross-Platform
- [ ] Windows support (different config paths)
- [ ] Linux support
- [ ] Auto-detect installed AI tools on system
- [ ] Handle platform-specific path conventions

### v0.4.0 - Advanced Features
- [ ] JetBrains integration via external MCP config
- [ ] Continue.dev config support
- [ ] Config templates for common MCP servers
- [ ] Import configs from one tool to another
- [ ] Export unified config bundle

### v0.5.0 - Server Management
- [ ] Start/stop MCP servers from UI
- [ ] Real-time server logs
- [ ] Server resource monitoring (CPU, memory)
- [ ] Auto-restart on failure

### v1.0.0 - Production Ready
- [ ] Full multi-platform support
- [ ] All major AI coding tools supported
- [ ] Server marketplace integration
- [ ] Team config sharing
- [ ] CLI companion tool (`mcphub sync`)

## Config File Formats

All supported tools use similar JSON schema based on the MCP standard:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

### Variations

**Windsurf HTTP servers:**
```json
{
  "mcpServers": {
    "server-name": {
      "serverUrl": "http://localhost:3000/mcp"
    }
  }
}
```

**Cursor remote servers:**
```json
{
  "mcpServers": {
    "server-name": {
      "url": "http://localhost:3000/mcp",
      "headers": {"API_KEY": "value"}
    }
  }
}
```

**Cursor variable interpolation:**
- `${env:NAME}` - Environment variable
- `${workspaceFolder}` - Current workspace
- `${userHome}` - User home directory

## Research Links

- [Windsurf MCP Docs](https://docs.windsurf.com/windsurf/cascade/mcp)
- [Cursor MCP Docs](https://cursor.com/docs/context/mcp)
- [JetBrains AI Assistant MCP](https://www.jetbrains.com/help/ai-assistant/mcp.html)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Claude Desktop MCP](https://docs.anthropic.com/en/docs/claude-code/tutorials#set-up-model-context-protocol-mcp)

## Contributing

Want to add support for a new tool? Here's what we need:

1. **Config file location(s)** - Where does the tool store MCP settings?
2. **JSON schema** - What format does it use?
3. **Platform differences** - Different paths on macOS/Windows/Linux?
4. **Detection method** - How to check if tool is installed?
5. **Documentation link** - Official docs for reference

Open an issue or PR with this information!

---

*Last updated: December 2025*
