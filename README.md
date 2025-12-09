# MCPHub

A native macOS application for managing MCP (Model Context Protocol) server configurations across Claude Code, Claude Desktop, and Roo Code.

![MCPHub Screenshot](docs/screenshot.png)

## Features

- **Unified Management** - View and manage all MCP servers from a single interface
- **Per-System Toggle** - Enable/disable servers individually for each AI tool
- **Health Monitoring** - Test server connections and see status at a glance
- **Sync Configs** - Keep configurations in sync across all three tools
- **Auto-Backup** - Automatic backups before any config changes
- **Path Expansion** - Automatically expands `~` to full paths

## Supported Tools

| Tool | Config Location |
|------|-----------------|
| Claude Code | `~/.claude/.mcp.json` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Roo Code | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |

## Installation

### Download Release

Download the latest `.dmg` from the [Releases](https://github.com/BioInfo/mcphub/releases) page.

### Build from Source

**Prerequisites:**
- macOS 12.0+ (Monterey or later)
- Rust 1.70+
- Node.js 18+
- Xcode Command Line Tools

```bash
# Clone the repository
git clone https://github.com/BioInfo/mcphub.git
cd mcphub

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production app
npm run tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Usage

### Server List

The left panel shows all MCP servers discovered across your config files. Each server displays status indicators showing which tools have it enabled:

- Green dot = Server enabled and healthy
- Yellow dot = Server untested
- Red dot = Server has errors
- Gray dot = Server disabled for that tool

### Server Details

Click a server to view and edit its configuration:
- **Command** - The executable (e.g., `npx`, `node`, `python`)
- **Arguments** - Command line arguments
- **Environment Variables** - Key-value pairs passed to the server
- **Always Allow** - MCP permissions granted without prompting

### Per-System Controls

Toggle switches let you enable/disable a server for each tool independently:

```
Claude Code     [ON]
Claude Desktop  [ON]
Roo Code        [OFF]
```

### Testing Servers

Click "Test Connection" to verify a server can start successfully. MCPHub will:
1. Resolve the command path
2. Verify all file paths exist
3. Start the server briefly
4. Report success or show error messages

### Syncing

Use "Sync All" to copy the configuration from one tool to all others. Useful when you've made changes in one place and want them everywhere.

## Architecture

MCPHub is built with:

- **[Tauri 2.x](https://tauri.app)** - Native app framework (Rust backend + web frontend)
- **React 19** - Frontend UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons

### Project Structure

```
mcphub/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/             # Zustand state
│   ├── lib/                # Tauri IPC wrappers
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   └── src/
│       ├── config.rs       # Config file operations
│       ├── commands.rs     # Tauri IPC commands
│       └── error.rs        # Error handling
└── docs/                   # Documentation
```

## Development

```bash
# Start dev server with hot reload
npm run tauri dev

# Type check
npm run lint

# Build for production
npm run tauri build
```

### Tauri Commands

The Rust backend exposes these commands to the frontend:

| Command | Description |
|---------|-------------|
| `get_all_configs` | Read all three config files |
| `get_managed_servers` | Get unified server list |
| `save_server` | Add or update a server |
| `delete_server` | Remove server from all configs |
| `set_server_enabled` | Toggle server for specific tool |
| `test_server_connection` | Test if server can start |
| `sync_all_servers` | Copy config from source to all targets |
| `backup_configs` | Create timestamped backups |

## Backups

MCPHub stores backups in `~/.mcphub/backups/` with timestamps:
```
cc_20241209_143022.json
cd_20241209_143022.json
rc_20241209_143022.json
```

App state (health status, test results) is stored in `~/.mcphub/state.json`.

## Security

- **No network requests** - MCPHub works entirely offline
- **No telemetry** - No data collection or analytics
- **Local only** - Only reads/writes to known config paths
- **Open source** - Full transparency

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Anthropic](https://anthropic.com) for Claude and the MCP protocol
- [Tauri](https://tauri.app) for the excellent app framework
- [Roo Code](https://github.com/RooVetGit/Roo-Code) for VS Code MCP support
