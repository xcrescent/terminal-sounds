import * as path from "path";
import * as vscode from "vscode";
import { SoundPlayer } from "./soundPlayer";

export type SoundEvent =
  | "terminalOpened"
  | "terminalClosed"
  | "commandStarted"
  | "commandSucceeded"
  | "commandFailed";

const SOUND_FILE_MAP: Record<SoundEvent, string> = {
  terminalOpened: "terminal-open.wav",
  terminalClosed: "terminal-close.wav",
  commandStarted: "command-start.wav",
  commandSucceeded: "command-success.wav",
  commandFailed: "command-fail.wav",
};

export class SoundManager {
  private player: SoundPlayer;
  private soundsDir: string;
  private config!: {
    enabled: boolean;
    volume: number;
    sounds: Record<SoundEvent, boolean>;
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
    };
  }

  play(event: SoundEvent): void {
    if (!this.config.enabled || !this.config.sounds[event]) {
      return;
    }
    const filePath = path.join(this.soundsDir, SOUND_FILE_MAP[event]);
    this.player.play(filePath, this.config.volume);
  }

  playForce(event: SoundEvent): void {
    const filePath = path.join(this.soundsDir, SOUND_FILE_MAP[event]);
    this.player.play(filePath, this.config.volume);
  }

  dispose(): void {
    this.player.dispose();
  }
}
