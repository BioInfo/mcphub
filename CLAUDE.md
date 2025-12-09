# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCPHub is a native macOS desktop application for managing MCP (Model Context Protocol) server configurations across Claude Code, Claude Desktop, and Roo Code. Built with Tauri 2.x (Rust backend + React frontend).

## Build Commands

```bash
# Install dependencies
npm install

# Development (starts Tauri dev server with hot reload)
npm run tauri dev

# Build production app (.app and .dmg)
npm run tauri build

# Frontend only (no Tauri)
npm run dev

# Type check
npm run lint
```

## Architecture

**Tauri IPC Pattern**: Frontend calls Rust backend via `invoke()` commands defined in `src/lib/tauri.ts`. All file operations happen in Rust for security and performance.

**Three-Layer Architecture**:
1. `src/` - React + TypeScript frontend with Tailwind CSS
2. `src-tauri/src/` - Rust backend (config.rs, commands.rs, error.rs)
3. `src/stores/appStore.ts` - Zustand for frontend state management

**Config Files Managed**:
- `~/.claude/.mcp.json` - Claude Code
- `~/Library/Application Support/Claude/claude_desktop_config.json` - Claude Desktop
- `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` - Roo Code

## Key Files

**Rust Backend** (`src-tauri/src/`):
- `lib.rs` - App setup, plugin registration, command handlers
- `config.rs` - ConfigManager struct, config file reading/writing, path expansion
- `commands.rs` - Tauri command definitions (get_all_configs, save_server, test_server_connection, etc.)
- `error.rs` - AppError enum with thiserror

**Frontend** (`src/`):
- `stores/appStore.ts` - Zustand store with all app state and actions
- `lib/tauri.ts` - TypeScript wrappers for Rust commands
- `types/mcp.ts` - TypeScript interfaces matching Rust structs
- `components/` - React components (TitleBar, Sidebar, ServerList, ServerCard, ServerDetail, AddServerModal)

## Data Types

```typescript
interface ManagedServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  alwaysAllow: string[];
  systems: Record<'claudeCode' | 'claudeDesktop' | 'rooCode', { enabled: boolean; present: boolean }>;
  health: 'healthy' | 'untested' | 'error' | 'disabled';
}
```

## Tauri Commands

Commands in `src-tauri/src/commands.rs`:
- `get_all_configs()` - Read all three config files
- `get_managed_servers()` - Get unified server list with per-system status
- `save_server(request)` - Add/update server to specified targets
- `delete_server(name)` - Remove server from all configs
- `set_server_enabled(request)` - Toggle server for specific system
- `test_server_connection(name, server)` - Spawn process and check health
- `sync_server(request)` / `sync_all_servers(source)` - Sync configs
- `backup_configs()` - Create timestamped backups

## Path Handling

The Rust backend expands `~` to full paths via `dirs::home_dir()`. Always use `ConfigManager::expand_path()` before writing to config files.

## Styling

Uses Tailwind CSS 3.x with custom design tokens in `tailwind.config.js`:
- `surface-*` colors for dark mode backgrounds
- `brand-*` for primary accents
- `success-*`, `warning-*`, `danger-*` for semantic colors
- Custom component classes in `src/index.css` (`.card`, `.btn-*`, `.badge-*`, etc.)
