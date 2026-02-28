# Terminal Sounds

A VS Code extension that plays short sound effects on terminal events — open, close, command start, command success, and command failure.

## Features

| Event | Sound | Default |
|-------|-------|---------|
| Terminal opened | Rising two-tone chime (C5 → E5) | Enabled |
| Terminal closed | Falling two-tone chime (E5 → C5) | Enabled |
| Command started | Short click/tick | Disabled |
| Command succeeded (exit code 0) | Ascending major arpeggio (C5 → E5 → G5) | Enabled |
| Command failed (non-zero exit) | Descending low buzzer sweep | Enabled |

Command-level sounds (start/success/fail) require [VS Code shell integration](https://code.visualstudio.com/docs/terminal/shell-integration) (enabled by default in VS Code 1.93+ for bash, zsh, fish, and PowerShell).

### Command-Specific Sounds

Recognized commands get their own distinct sound that **overrides** the generic success sound:

| Category | Commands | Sound |
|----------|----------|-------|
| Git | `git` | Quick double-tap pluck (G4 → B4) |
| Package manager | `npm install`, `yarn`, `pnpm`, `pip`, `brew`, `apt`, `gem`, `composer` | Bubbly ascending arpeggio (E4 → G4 → B4 → E5) |
| Testing | `jest`, `pytest`, `vitest`, `mocha`, `cargo test`, `go test`, `rspec` | Radar ping (D5 → A5) |
| Build/run | `npm run`, `node`, `python`, `make`, `cargo`, `go`, `docker`, `webpack`, `tsc`, `gcc` | Mechanical whirr ramp-up |
| Cloud/infra | `kubectl`, `terraform`, `aws`, `gcloud`, `az`, `helm`, `vercel`, `netlify` | Deep ambient hum |
| Database | `mysql`, `psql`, `mongo`, `redis-cli`, `sqlite3`, `pg_dump` | Data chirp (C6 → G5 → C6) |
| Network | `curl`, `wget`, `ping`, `dig`, `nslookup`, `nmap` | Rising signal swoosh |
| File ops | `cp`, `mv`, `rm`, `mkdir`, `touch`, `tar`, `zip`, `rsync` | Quick shuffle click |
| Navigation | `cd`, `ls`, `pwd`, `ssh`, `cat`, `find`, `grep`, `rg`, `tree` | Soft pop blip |

If a command fails (non-zero exit), the generic fail sound plays regardless of category.

## Settings

All settings are under `terminalSounds.*` in VS Code settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `terminalSounds.enabled` | boolean | `true` | Master toggle for all sounds |
| `terminalSounds.volume` | number | `50` | Volume level (0–100) |
| `terminalSounds.sounds.terminalOpened` | boolean | `true` | Sound on terminal open |
| `terminalSounds.sounds.terminalClosed` | boolean | `true` | Sound on terminal close |
| `terminalSounds.sounds.commandStarted` | boolean | `false` | Sound on command start |
| `terminalSounds.sounds.commandSucceeded` | boolean | `true` | Sound on exit code 0 |
| `terminalSounds.sounds.commandFailed` | boolean | `true` | Sound on non-zero exit |
| `terminalSounds.customSounds.terminalOpened` | string | `""` | Custom `.wav` file path for terminal opened |
| `terminalSounds.customSounds.terminalClosed` | string | `""` | Custom `.wav` file path for terminal closed |
| `terminalSounds.customSounds.commandStarted` | string | `""` | Custom `.wav` file path for command started |
| `terminalSounds.customSounds.commandSucceeded` | string | `""` | Custom `.wav` file path for command succeeded |
| `terminalSounds.customSounds.commandFailed` | string | `""` | Custom `.wav` file path for command failed |

Set any `customSounds` path to an absolute path to a `.wav` file to override the built-in sound. Leave empty to use the default.

### Command-Specific Sound Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `terminalSounds.commandSounds.enabled` | boolean | `true` | Enable command-specific sounds |
| `terminalSounds.commandSounds.custom.git` | string | `""` | Custom `.wav` for git commands |
| `terminalSounds.commandSounds.custom.package` | string | `""` | Custom `.wav` for package manager commands |
| `terminalSounds.commandSounds.custom.build` | string | `""` | Custom `.wav` for build/run commands |
| `terminalSounds.commandSounds.custom.navigation` | string | `""` | Custom `.wav` for navigation commands |
| `terminalSounds.commandSounds.custom.network` | string | `""` | Custom `.wav` for network commands |
| `terminalSounds.commandSounds.custom.fileops` | string | `""` | Custom `.wav` for file operation commands |
| `terminalSounds.commandSounds.custom.cloud` | string | `""` | Custom `.wav` for cloud/infra commands |
| `terminalSounds.commandSounds.custom.database` | string | `""` | Custom `.wav` for database commands |
| `terminalSounds.commandSounds.custom.testing` | string | `""` | Custom `.wav` for test runner commands |

## Commands

- **Terminal Sounds: Test All Sounds** — plays all 14 sounds in sequence (5 event + 9 command category sounds)

---

## Development

### Prerequisites

- Node.js >= 20
- npm

### Setup

```bash
git clone <repo-url>
cd terminal-sounds
npm install
```

### Build

```bash
npm run build          # generate sounds + bundle for production
npm run watch          # esbuild watch mode (for development)
npm run generate-sounds # regenerate WAV files only
```

### Run in Development

1. Open the `terminal-sounds/` folder in VS Code / Cursor
2. Press **F5** — launches an Extension Development Host window
3. In the new window, open/close terminals and run commands to hear sounds
4. Check the **Output** panel → **"Terminal Sounds"** channel for event logs

### Package

```bash
npm run package        # produces terminal-sounds-<version>.vsix
```

Install the `.vsix` via `Cmd+Shift+P` → **"Extensions: Install from VSIX..."**

### Publish

```bash
# VS Code Marketplace
npx @vscode/vsce login <publisher>
npx @vscode/vsce publish

# Open VSX (Cursor / open editors)
npx ovsx publish terminal-sounds-<version>.vsix -p <token>
```

---

## Architecture

### Project Structure

```
terminal-sounds/
├── .vscode/
│   ├── launch.json                # F5 debug configuration (Extension Host)
│   └── tasks.json                 # esbuild watch task
├── src/
│   ├── extension.ts               # Entry point — event wiring
│   ├── soundManager.ts            # Event → sound file mapping + config
│   └── soundPlayer.ts             # Cross-platform audio playback
├── scripts/
│   └── generate-sounds.ts         # Programmatic WAV file generator
├── sounds/                        # Generated .wav files (~53 KB total)
│   ├── terminal-open.wav
│   ├── terminal-close.wav
│   ├── command-start.wav
│   ├── command-success.wav
│   └── command-fail.wav
├── dist/
│   └── extension.js               # Bundled output (esbuild, ~4 KB)
├── package.json
├── tsconfig.json
├── esbuild.mjs
├── .gitignore
└── .vscodeignore
```

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│  extension.ts                                   │
│  Registers VS Code event listeners, wires       │
│  terminal events to the SoundManager.           │
│  Owns the extension lifecycle (activate/        │
│  deactivate) and the output channel for debug   │
│  logging.                                       │
├─────────────────────────────────────────────────┤
│  soundManager.ts                                │
│  Maps SoundEvent names to .wav filenames.       │
│  Reads VS Code workspace configuration to       │
│  decide whether a sound should play. Delegates  │
│  actual playback to SoundPlayer.                │
├─────────────────────────────────────────────────┤
│  soundPlayer.ts                                 │
│  Cross-platform fire-and-forget audio. Spawns   │
│  native audio players via child_process.        │
│  Tracks active processes for cleanup.           │
└─────────────────────────────────────────────────┘
```

### `src/extension.ts` — Entry Point

Handles extension activation and deactivation. Registers four event listeners:

- **`vscode.window.onDidOpenTerminal`** — fires when any terminal is created
- **`vscode.window.onDidCloseTerminal`** — fires when any terminal is disposed
- **`vscode.window.onDidStartTerminalShellExecution`** — fires when a command begins executing (requires shell integration)
- **`vscode.window.onDidEndTerminalShellExecution`** — fires when a command finishes; provides `exitCode` to distinguish success from failure

The shell integration APIs are guarded with a runtime check (`if (vscode.window.onDidStartTerminalShellExecution)`) so the extension degrades gracefully on older editors.

An output channel (`"Terminal Sounds"`) logs every event for debugging.

### `src/soundManager.ts` — Orchestration

Defines the `SoundEvent` type union and a static map from event names to `.wav` filenames:

```typescript
type SoundEvent =
  | "terminalOpened" | "terminalClosed"
  | "commandStarted" | "commandSucceeded" | "commandFailed";
```

`play(event)` checks the master toggle and the per-event toggle before delegating to `SoundPlayer`. `playForce(event)` bypasses config checks (used by the test command).

Configuration is cached and refreshed via `reloadConfig()` when `vscode.workspace.onDidChangeConfiguration` fires.

### `src/soundPlayer.ts` — Cross-Platform Audio

Plays `.wav` files using platform-native commands:

| Platform | Command | Volume Support |
|----------|---------|----------------|
| macOS | `afplay -v <0.0–1.0> <file>` | Yes (mapped from 0–100) |
| Linux | `paplay --volume <0–65536> <file>` | Yes, falls back to `aplay -q` |
| Windows | `powershell -Command (New-Object System.Media.SoundPlayer ...).PlaySync()` | No |

Key design choices:
- **Fire-and-forget**: `play()` returns `void`, never blocks the event loop
- **Process tracking**: a `Set<ChildProcess>` tracks all spawned audio processes so `dispose()` can kill them on deactivation
- **Linux fallback**: if `paplay` (PulseAudio) fails, automatically retries with `aplay` (ALSA)

### `scripts/generate-sounds.ts` — WAV Generator

Generates 5 small WAV files from pure math — no audio dependencies or binary assets needed.

**How it works:**

1. Defines sound profiles as arrays of `ToneSegment` objects (frequency, duration, amplitude, waveform type, fade envelope)
2. `generateSamples()` renders segments into a `Int16Array` of 16-bit PCM samples at 44.1 kHz
3. `writeWav()` writes a standard 44-byte RIFF/WAV header followed by the raw PCM data

**WAV header structure (44 bytes):**

```
Bytes 0–3:   "RIFF"
Bytes 4–7:   file size − 8 (uint32 LE)
Bytes 8–11:  "WAVE"
Bytes 12–15: "fmt "
Bytes 16–19: 16 (fmt chunk size)
Bytes 20–21: 1 (PCM format)
Bytes 22–23: 1 (mono)
Bytes 24–27: 44100 (sample rate)
Bytes 28–31: 88200 (byte rate)
Bytes 32–33: 2 (block align)
Bytes 34–35: 16 (bits per sample)
Bytes 36–39: "data"
Bytes 40–43: data size (uint32 LE)
Bytes 44+:   PCM samples (int16 LE)
```

**Sound designs:**

| Sound | Technique |
|-------|-----------|
| `terminal-open` | Two sequential sine tones: C5 (523 Hz, 80ms) → E5 (659 Hz, 80ms) |
| `terminal-close` | Reverse: E5 → C5 |
| `command-start` | Single 25ms square wave burst at 800 Hz |
| `command-success` | Three ascending sine tones: C5 → E5 → G5 (60ms, 60ms, 80ms) |
| `command-fail` | 10 chained 20ms square wave segments sweeping 400 Hz → 200 Hz |

### Build Tooling

**esbuild** bundles `src/extension.ts` → `dist/extension.js` as a single CommonJS file. The `vscode` module is marked as external (provided by the runtime). Production builds are minified; dev builds include sourcemaps.

**tsx** runs the sound generator script directly (TypeScript execution without a separate compile step).

**`.vscodeignore`** ensures the packaged `.vsix` only contains `dist/`, `sounds/`, and `package.json` — source code, scripts, and `node_modules/` are excluded.

### VS Code Extension Manifest (`package.json`)

Key fields:

- **`engines.vscode: "^1.93.0"`** — minimum VS Code version for stable shell integration APIs
- **`activationEvents: ["onStartupFinished"]`** — activates after VS Code finishes starting (non-blocking); necessary because terminal events can fire at any time
- **`main: "./dist/extension.js"`** — points to the esbuild bundle
- **`contributes.configuration`** — declares 7 settings that appear in the VS Code Settings UI under "Terminal Sounds"
- **`contributes.commands`** — registers the "Test All Sounds" command in the Command Palette

---

## Troubleshooting

### Command sounds not working

The command start/success/fail sounds require VS Code's shell integration. Check:

1. **Setting**: `terminal.integrated.shellIntegration.enabled` must be `true` (default)
2. **Shell**: must be bash, zsh, fish, or PowerShell — other shells are not supported
3. **Editor version**: VS Code >= 1.93 or a Cursor version based on it
4. **Debug**: open Output panel → "Terminal Sounds" — look for "Shell integration API available" or "NOT available"

### No sound at all

- Check that `terminalSounds.enabled` is `true` in settings
- On Linux, ensure `paplay` or `aplay` is installed
- On macOS, `afplay` is built-in and should always work
- Try the "Terminal Sounds: Test All Sounds" command from the Command Palette

### Replacing sounds

Drop your own `.wav` files into the `sounds/` directory with the same filenames. Mono, 16-bit, 44.1 kHz WAV is recommended. Reload the extension window after replacing.

## License

MIT
