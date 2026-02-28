import { execFile, ChildProcess } from "child_process";
import * as os from "os";

export class SoundPlayer {
  private activeProcesses = new Set<ChildProcess>();

  play(filePath: string, volume: number = 50): void {
    const platform = os.platform();

    let command: string;
    let args: string[];

    switch (platform) {
      case "darwin": {
        const afplayVolume = (volume / 100).toFixed(2);
        command = "afplay";
        args = ["-v", afplayVolume, filePath];
        break;
      }
      case "linux": {
        const paVolume = Math.round((volume / 100) * 65536);
        command = "paplay";
        args = ["--volume", paVolume.toString(), filePath];
        break;
      }
      case "win32": {
        command = "powershell";
        args = [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `(New-Object System.Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`,
        ];
        break;
      }
      default:
        console.warn(`[terminal-sounds] Unsupported platform: ${platform}`);
        return;
    }

    const child = execFile(command, args, (error) => {
      this.activeProcesses.delete(child);

      if (error && platform === "linux") {
        const fallback = execFile("aplay", ["-q", filePath], () => {
          this.activeProcesses.delete(fallback);
        });
        this.activeProcesses.add(fallback);
        return;
      }

      if (error) {
        console.warn(`[terminal-sounds] Failed to play sound: ${error.message}`);
      }
    });

    this.activeProcesses.add(child);
  }

  dispose(): void {
    for (const proc of this.activeProcesses) {
      proc.kill();
    }
    this.activeProcesses.clear();
  }
}
