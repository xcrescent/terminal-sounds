# Terminal Sounds — VS Code Extension

## Project Overview
A VS Code extension that plays distinct sound effects on terminal events and recognizes 100+ CLI commands across 9 categories. Built with TypeScript, bundled with esbuild, zero runtime dependencies.

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Bundler**: esbuild → `dist/extension.js` (CJS, `vscode` external)
- **Sound generation**: Pure TypeScript WAV writer (`scripts/generate-sounds.ts`) — no audio libraries
- **Audio playback**: Platform-native via `child_process.execFile` (afplay/paplay/powershell)
- **Min VS Code version**: 1.93 (for shell integration APIs)

## Architecture
```
extension.ts → soundManager.ts → soundPlayer.ts
     │                │
     │      reads config + matches commands
     │      to categories, resolves file paths
     │
  registers VS Code terminal event listeners
```

- `src/extension.ts` — Entry point. Registers 4 terminal event listeners + test command + config watcher. Guards shell integration APIs with runtime check.
- `src/soundManager.ts` — Maps `SoundEvent` and `CommandCategory` to `.wav` files. Reads `terminalSounds.*` config. `matchCommand()` matches command text to categories via prefix matching.
- `src/soundPlayer.ts` — Cross-platform fire-and-forget WAV playback. Tracks child processes for cleanup on deactivate. Linux: paplay → aplay fallback.
- `scripts/generate-sounds.ts` — Generates 14 WAV files from `ToneSegment[]` definitions. Run via `npm run generate-sounds`.

## Key Commands
```bash
npm install              # install deps
npm run build            # generate sounds + production bundle
npm run watch            # esbuild watch mode for development
npm run generate-sounds  # regenerate WAV files only
npm run package          # create .vsix
```

## Development Workflow
1. Press F5 in VS Code/Cursor to launch Extension Development Host
2. Check Output panel → "Terminal Sounds" for event debug logs
3. `npm run watch` for live rebuilds during development

## Sound Categories
Command-specific sounds override generic success/fail. Matching is prefix-based in `DEFAULT_CMD_PATTERNS` (soundManager.ts). Categories: git, package, testing, build, cloud, database, network, fileops, navigation.

## Adding a New Command Category
1. Add to `CommandCategory` type in `soundManager.ts`
2. Add entry in `CMD_SOUND_FILE_MAP`, `DEFAULT_CMD_PATTERNS`
3. Add config reading in `reloadConfig()` → `customCommandSounds`
4. Add `ToneSegment[]` definition in `scripts/generate-sounds.ts`
5. Add setting in `package.json` → `contributes.configuration.properties`
6. Run `npm run build` to generate the new `.wav` and verify

## Publishing
- **GitHub**: `gh release create v<x.y.z> terminal-sounds-<x.y.z>.vsix`
- **VS Code Marketplace**: `npx @vscode/vsce publish` (needs PAT setup)
- **Open VSX**: `npx ovsx publish <vsix> -p <token>`
- Publisher: `xcrescent`
- Repo: https://github.com/xcrescent/terminal-sounds

## Conventions
- Keep sounds short (<250ms) and non-intrusive
- All WAV files: mono, 16-bit PCM, 44.1 kHz
- No runtime npm dependencies — dev dependencies only
- Settings scoped to `terminalSounds.*` with `"scope": "window"`
- Always rebuild sounds before packaging (`npm run build` does this)
