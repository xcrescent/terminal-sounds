import * as path from "path";
import * as vscode from "vscode";
import { SoundPlayer } from "./soundPlayer";

export type SoundEvent =
  | "terminalOpened"
  | "terminalClosed"
  | "commandStarted"
  | "commandSucceeded"
  | "commandFailed";

export type CommandCategory = "git" | "package" | "build" | "navigation" | "network" | "fileops" | "cloud" | "database" | "testing";

const SOUND_FILE_MAP: Record<SoundEvent, string> = {
  terminalOpened: "terminal-open.wav",
  terminalClosed: "terminal-close.wav",
  commandStarted: "command-start.wav",
  commandSucceeded: "command-success.wav",
  commandFailed: "command-fail.wav",
};

const CMD_SOUND_FILE_MAP: Record<CommandCategory, string> = {
  git: "cmd-git.wav",
  package: "cmd-package.wav",
  build: "cmd-build.wav",
  navigation: "cmd-navigation.wav",
  network: "cmd-network.wav",
  fileops: "cmd-fileops.wav",
  cloud: "cmd-cloud.wav",
  database: "cmd-database.wav",
  testing: "cmd-testing.wav",
};

const DEFAULT_CMD_PATTERNS: Record<CommandCategory, string[]> = {
  git: ["git "],
  package: ["npm install", "npm ci", "npm update", "npm uninstall", "yarn add", "yarn install", "yarn remove", "pnpm install", "pnpm add", "pnpm remove", "pip install", "pip uninstall", "pip3 install", "brew install", "brew uninstall", "brew upgrade", "apt install", "apt-get install", "apt remove", "dnf install", "pacman -S", "gem install", "composer install", "composer require"],
  testing: ["npm test", "npx jest", "npx vitest", "npx mocha", "jest ", "vitest ", "mocha ", "pytest", "cargo test", "go test", "rspec", "phpunit", "dotnet test"],
  build: ["npm run", "npm start", "npx ", "node ", "python ", "python3 ", "make", "cargo build", "cargo run", "go run", "go build", "docker ", "docker-compose", "gradle", "mvn ", "dotnet build", "dotnet run", "ruby ", "php ", "javac ", "java ", "gcc ", "g++ ", "rustc ", "webpack", "vite ", "tsc"],
  cloud: ["kubectl ", "helm ", "terraform ", "aws ", "gcloud ", "az ", "pulumi ", "ansible ", "vagrant ", "flyctl ", "vercel ", "netlify ", "heroku "],
  database: ["mysql ", "psql ", "mongo ", "mongosh ", "redis-cli", "sqlite3 ", "pg_dump", "pg_restore", "mysqldump", "mongodump", "mongorestore"],
  network: ["curl ", "wget ", "ping ", "traceroute ", "dig ", "nslookup ", "nc ", "netcat ", "nmap ", "http ", "httpie "],
  fileops: ["cp ", "mv ", "rm ", "mkdir ", "touch ", "chmod ", "chown ", "ln ", "tar ", "zip ", "unzip ", "gzip ", "gunzip ", "rsync "],
  navigation: ["cd ", "ls", "pwd", "dir", "ssh ", "scp ", "cat ", "less ", "head ", "tail ", "find ", "fd ", "grep ", "rg ", "ag ", "ack ", "tree", "which ", "whereis ", "locate "],
};

export class SoundManager {
  private player: SoundPlayer;
  private soundsDir: string;
  private config!: {
    enabled: boolean;
    volume: number;
    sounds: Record<SoundEvent, boolean>;
    customSounds: Record<SoundEvent, string>;
    commandSoundsEnabled: boolean;
    customCommandSounds: Record<CommandCategory, string>;
  };

  constructor(extensionPath: string) {
    this.player = new SoundPlayer();
    this.soundsDir = path.join(extensionPath, "sounds");
    this.reloadConfig();
  }

  reloadConfig(): void {
    const cfg = vscode.workspace.getConfiguration("terminalSounds");
    this.config = {
      enabled: cfg.get<boolean>("enabled", true),
      volume: cfg.get<number>("volume", 50),
      sounds: {
        terminalOpened: cfg.get<boolean>("sounds.terminalOpened", true),
        terminalClosed: cfg.get<boolean>("sounds.terminalClosed", true),
        commandStarted: cfg.get<boolean>("sounds.commandStarted", false),
        commandSucceeded: cfg.get<boolean>("sounds.commandSucceeded", true),
        commandFailed: cfg.get<boolean>("sounds.commandFailed", true),
      },
      customSounds: {
        terminalOpened: cfg.get<string>("customSounds.terminalOpened", ""),
        terminalClosed: cfg.get<string>("customSounds.terminalClosed", ""),
        commandStarted: cfg.get<string>("customSounds.commandStarted", ""),
        commandSucceeded: cfg.get<string>("customSounds.commandSucceeded", ""),
        commandFailed: cfg.get<string>("customSounds.commandFailed", ""),
      },
      commandSoundsEnabled: cfg.get<boolean>("commandSounds.enabled", true),
      customCommandSounds: {
        git: cfg.get<string>("commandSounds.custom.git", ""),
        package: cfg.get<string>("commandSounds.custom.package", ""),
        build: cfg.get<string>("commandSounds.custom.build", ""),
        navigation: cfg.get<string>("commandSounds.custom.navigation", ""),
        network: cfg.get<string>("commandSounds.custom.network", ""),
        fileops: cfg.get<string>("commandSounds.custom.fileops", ""),
        cloud: cfg.get<string>("commandSounds.custom.cloud", ""),
        database: cfg.get<string>("commandSounds.custom.database", ""),
        testing: cfg.get<string>("commandSounds.custom.testing", ""),
      },
    };
  }

  private resolveSoundPath(event: SoundEvent): string {
    const custom = this.config.customSounds[event];
    if (custom) {
      return custom;
    }
    return path.join(this.soundsDir, SOUND_FILE_MAP[event]);
  }

  private resolveCmdSoundPath(category: CommandCategory): string {
    const custom = this.config.customCommandSounds[category];
    if (custom) {
      return custom;
    }
    return path.join(this.soundsDir, CMD_SOUND_FILE_MAP[category]);
  }

  matchCommand(commandLine: string): CommandCategory | null {
    if (!this.config.commandSoundsEnabled) {
      return null;
    }
    const trimmed = commandLine.trimStart();
    for (const [category, patterns] of Object.entries(DEFAULT_CMD_PATTERNS)) {
      for (const pattern of patterns) {
        if (trimmed.startsWith(pattern)) {
          return category as CommandCategory;
        }
      }
    }
    return null;
  }

  play(event: SoundEvent): void {
    if (!this.config.enabled || !this.config.sounds[event]) {
      return;
    }
    this.player.play(this.resolveSoundPath(event), this.config.volume);
  }

  playCommand(category: CommandCategory): void {
    if (!this.config.enabled) {
      return;
    }
    this.player.play(this.resolveCmdSoundPath(category), this.config.volume);
  }

  playForce(event: SoundEvent): void {
    this.player.play(this.resolveSoundPath(event), this.config.volume);
  }

  playForceCommand(category: CommandCategory): void {
    this.player.play(this.resolveCmdSoundPath(category), this.config.volume);
  }

  dispose(): void {
    this.player.dispose();
  }
}
