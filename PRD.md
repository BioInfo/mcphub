# MCPHub - MCP Server Configuration Manager

**Product Requirements Document**

## Overview

MCPHub is a native macOS desktop application for managing Model Context Protocol (MCP) server configurations across multiple AI coding assistants. It provides a unified interface to configure, sync, and monitor MCP servers for Claude Code, Claude Desktop, and Roo Code (VS Code extension).

## Problem Statement

Managing MCP server configurations across multiple AI tools is currently painful:

1. **Fragmented configs** - Three separate JSON files in different locations
2. **Manual sync** - Changes must be manually replicated across all configs
3. **No validation** - Easy to introduce syntax errors or invalid paths
4. **No visibility** - No way to see server health or test connections
5. **Path issues** - `~` doesn't expand in JSON, leading to broken configs
6. **Duplicate entries** - Easy to accidentally create duplicate servers

## Target Users

- Developers using multiple AI coding assistants
- Power users with many MCP servers configured
- Anyone who wants a visual interface for MCP management

## Core Features

### 1. Unified Server Management

**Server List View**
- Display all MCP servers from all config files
- Show sync status (which configs have which servers)
- Visual indicators for server health/availability
- Group by: All, Claude Code only, Claude Desktop only, Roo Code only, Synced

**Server Details Panel**
- Server name and command
- Arguments and environment variables
- `alwaysAllow` permissions list
- Edit in-place with validation

**Per-System Enable/Disable**
- Toggle switches for each system (Claude Code, Claude Desktop, Roo Code)
- Enable/disable server per-system without deleting config
- Visual matrix showing server × system status
- Bulk enable/disable across systems
- Disabled servers stored in a separate `_disabled` section or removed from config

```
┌─────────────────────────────────────────────────────────┐
│  apple-mcp                                              │
│  ─────────────────────────────────────────────────────  │
│  Enable for:                                            │
│  [✓] Claude Code      [✓] Claude Desktop   [✓] Roo Code │
│                                                         │
│  Quick Actions:  [Enable All]  [Disable All]            │
└─────────────────────────────────────────────────────────┘
```

**Add New Server**
- Form-based server creation
- Auto-expand `~` to full paths
- Validate command exists on system
- Select which configs to add to (checkboxes for each system)
- Import from npm package name (auto-fill common servers)

### 2. Configuration Sync

**Sync Dashboard**
- Side-by-side comparison of all three configs
- Highlight differences (missing servers, config mismatches)
- One-click "Sync All" to make all configs identical
- Selective sync (choose which servers to sync where)

**Conflict Resolution**
- When configs differ, show diff view
- Choose "source of truth" config
- Merge strategies: union, intersection, prefer newest

### 3. Server Health Monitoring

**Connection Testing**
- Test if server can start successfully
- Show startup logs/errors
- Verify required environment variables are set
- Check if paths exist

**Status Indicators**
- Green: Server tested and working
- Yellow: Untested or requires manual verification
- Red: Failed to start or missing dependencies
- Gray: Disabled

### 4. Configuration Locations

**Managed Config Files:**
```
~/.claude/.mcp.json                    # Claude Code
~/Library/Application Support/Claude/claude_desktop_config.json  # Claude Desktop
~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json  # Roo Code
```

**Backup & History**
- Auto-backup before any changes
- View change history
- Restore previous versions
- Export/import configurations

### 5. Server Templates

**Built-in Templates for Common Servers:**
- filesystem (with path picker)
- github (with token input)
- postgresql (with connection string builder)
- perplexity (with API key input)
- context7 (with API key input)
- Custom local servers (path picker)

**Community Templates**
- Import from URL or JSON
- Share configurations

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Tauri 2.x |
| Backend | Rust |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Icons | Lucide React |
| Build | Vite |

### Directory Structure

```
mcphub/
├── src/                      # React frontend
│   ├── components/
│   │   ├── ServerList.tsx
│   │   ├── ServerCard.tsx
│   │   ├── ServerEditor.tsx
│   │   ├── SyncDashboard.tsx
│   │   ├── ConfigComparison.tsx
│   │   └── AddServerModal.tsx
│   ├── hooks/
│   │   ├── useServers.ts
│   │   ├── useConfigs.ts
│   │   └── useSync.ts
│   ├── stores/
│   │   └── appStore.ts
│   ├── types/
│   │   └── mcp.ts
│   ├── lib/
│   │   └── tauri.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── config.rs         # Config file operations
│   │   ├── server.rs         # Server testing
│   │   ├── sync.rs           # Sync logic
│   │   └── commands.rs       # Tauri commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── PRD.md
```

### Data Models

```typescript
// MCP Server Configuration
interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  alwaysAllow?: string[];
}

// Config file representation
interface MCPConfig {
  path: string;
  name: 'claude-code' | 'claude-desktop' | 'roo-code';
  servers: Record<string, MCPServer>;
  lastModified: Date;
  isValid: boolean;
}

// Per-system enable status
interface SystemStatus {
  enabled: boolean;
  present: boolean;  // Whether it exists in the config file
}

// Server with sync and enable status
interface ManagedServer extends MCPServer {
  // Per-system enable/disable status
  systems: {
    claudeCode: SystemStatus;
    claudeDesktop: SystemStatus;
    rooCode: SystemStatus;
  };
  health: 'healthy' | 'untested' | 'error' | 'disabled';
  lastTested?: Date;
  errorMessage?: string;
}

// MCPHub internal state (stored in ~/.mcphub/state.json)
interface MCPHubState {
  servers: Record<string, {
    // Master config - source of truth for server settings
    config: MCPServer;
    // Which systems this server is enabled for
    enabledSystems: {
      claudeCode: boolean;
      claudeDesktop: boolean;
      rooCode: boolean;
    };
  }>;
  lastSync: Date;
  version: string;
}
```

### Rust Backend Commands

```rust
// Config operations
#[tauri::command]
fn read_config(config_type: ConfigType) -> Result<MCPConfig, Error>

#[tauri::command]
fn write_config(config_type: ConfigType, config: MCPConfig) -> Result<(), Error>

#[tauri::command]
fn backup_config(config_type: ConfigType) -> Result<String, Error>

// Server operations
#[tauri::command]
fn test_server(server: MCPServer) -> Result<ServerHealth, Error>

#[tauri::command]
fn add_server(server: MCPServer, targets: Vec<ConfigType>) -> Result<(), Error>

#[tauri::command]
fn remove_server(name: String, targets: Vec<ConfigType>) -> Result<(), Error>

// Per-system enable/disable
#[tauri::command]
fn set_server_enabled(name: String, system: ConfigType, enabled: bool) -> Result<(), Error>

#[tauri::command]
fn set_server_enabled_all(name: String, enabled: bool) -> Result<(), Error>

#[tauri::command]
fn get_server_status(name: String) -> Result<ManagedServer, Error>

// Sync operations
#[tauri::command]
fn get_sync_status() -> Result<SyncStatus, Error>

#[tauri::command]
fn sync_all(source: ConfigType) -> Result<(), Error>

#[tauri::command]
fn sync_server(name: String, targets: Vec<ConfigType>) -> Result<(), Error>

// MCPHub state
#[tauri::command]
fn load_state() -> Result<MCPHubState, Error>

#[tauri::command]
fn save_state(state: MCPHubState) -> Result<(), Error>
```

## UI/UX Design

### Main Window Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  MCPHub                                              [_] [□] [×]         │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────────────────────────────────────┐  │
│  │ Servers        │  │  apple-mcp                              ● OK   │  │
│  │────────────────│  │────────────────────────────────────────────────│  │
│  │ ●●● apple-mcp  │  │  Command: bun                                  │  │
│  │ ●●● github     │  │  Args: run, /Users/.../apple-mcp/index.ts      │  │
│  │ ●●● firecrawl  │  │                                                │  │
│  │ ●●○ postgres   │  │  Environment Variables:                        │  │
│  │ ●●● perplexity │  │  (none)                                        │  │
│  │ ●●● context7   │  │                                                │  │
│  │ ...            │  │  Always Allow: contacts_search, messages_read  │  │
│  │                │  │                                                │  │
│  │ Legend:        │  │──────────────────────────────────────────────  │  │
│  │ ● = enabled    │  │  Enable for:                                   │  │
│  │ ○ = disabled   │  │                                                │  │
│  │ (CC/CD/RC)     │  │  Claude Code     [✓]  ──────────────○          │  │
│  │                │  │  Claude Desktop  [✓]  ──────────────○          │  │
│  │ [+ Add Server] │  │  Roo Code        [✓]  ──────────────○          │  │
│  │                │  │                                                │  │
│  │ Filter:        │  │  [Enable All] [Disable All]                    │  │
│  │ [All ▾]        │  │                                                │  │
│  └────────────────┘  │  [Test Connection]  [Save Changes]  [Delete]   │  │
│                      └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│  Status: All configs in sync ✓         [Sync All] [View Diff] [Backup]  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Server List Indicators:**
- Three dots represent: Claude Code, Claude Desktop, Roo Code
- `●●●` = enabled in all three
- `●●○` = enabled in Claude Code and Desktop, disabled in Roo Code
- `○○○` = disabled everywhere (grayed out in list)

**Alternative: Matrix View**
```
┌──────────────────────────────────────────────────────────────┐
│  Server            │ Claude Code │ Claude Desktop │ Roo Code │
│────────────────────┼─────────────┼────────────────┼──────────│
│  apple-mcp         │     [✓]     │      [✓]       │   [✓]    │
│  github            │     [✓]     │      [✓]       │   [✓]    │
│  firecrawl         │     [✓]     │      [✓]       │   [✓]    │
│  postgresql        │     [✓]     │      [✓]       │   [ ]    │
│  obsidian-search   │     [✓]     │      [ ]       │   [✓]    │
└──────────────────────────────────────────────────────────────┘
```

### Color Scheme

- Background: System (respects macOS dark/light mode)
- Accent: Blue (#0066CC)
- Success: Green (#22C55E)
- Warning: Yellow (#EAB308)
- Error: Red (#EF4444)
- Muted: Gray (#6B7280)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘ + N | Add new server |
| ⌘ + S | Save current server |
| ⌘ + ⇧ + S | Sync all configs |
| ⌘ + T | Test current server |
| ⌘ + , | Open preferences |
| ⌘ + F | Search servers |
| Delete | Remove selected server |

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Tauri + React project setup
- [ ] Read all three config files
- [ ] Display server list
- [ ] Basic server editing
- [ ] Save changes to configs
- [ ] Path validation and `~` expansion

### Phase 2: Sync Features
- [ ] Sync status indicators
- [ ] Config comparison view
- [ ] One-click sync all
- [ ] Selective sync
- [ ] Backup before changes

### Phase 3: Health Monitoring
- [ ] Server connection testing
- [ ] Health status indicators
- [ ] Error message display
- [ ] Startup log viewer

### Phase 4: Polish
- [ ] Server templates
- [ ] Import/export configs
- [ ] Change history
- [ ] Preferences panel
- [ ] Menu bar quick access
- [ ] Auto-start option

### Phase 5: Advanced
- [ ] Server process management (start/stop)
- [ ] Real-time log streaming
- [ ] Server marketplace/discovery
- [ ] Config sharing

## Success Metrics

1. **Time saved**: Reduce config management time from minutes to seconds
2. **Error reduction**: Zero syntax errors in generated configs
3. **Sync confidence**: Visual confirmation that all tools have same servers
4. **Adoption**: Daily use for MCP management

## Technical Requirements

### System Requirements
- macOS 12.0+ (Monterey or later)
- ~50 MB disk space
- No additional runtime dependencies (Tauri uses system WebKit)

### Build Requirements
- Rust 1.70+
- Node.js 18+
- Xcode Command Line Tools

### Security
- No network requests (fully offline)
- Read/write only to known config paths
- No telemetry or analytics
- Open source

## Future Considerations

1. **Linux/Windows support** - Tauri is cross-platform
2. **Additional AI tools** - Cursor, Continue, Cody, etc.
3. **MCP server discovery** - Browse and install from registry
4. **Team sharing** - Export/import for team standardization
5. **CLI companion** - `mcphub sync` for automation

## Appendix

### Config File Locations

| Tool | Path |
|------|------|
| Claude Code | `~/.claude/.mcp.json` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Roo Code | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |

### Common MCP Servers

| Server | Package | Purpose |
|--------|---------|---------|
| filesystem | @modelcontextprotocol/server-filesystem | File system access |
| github | @modelcontextprotocol/server-github | GitHub API |
| postgres | @modelcontextprotocol/server-postgres | PostgreSQL |
| perplexity | server-perplexity-ask | AI search |
| firecrawl | firecrawl-mcp | Web scraping |
| context7 | @upstash/context7-mcp | Library docs |

---

**Document Version:** 1.0
**Created:** 2025-12-09
**Author:** Justin Johnson + Claude
