import * as vscode from "vscode";
import { SoundManager, SoundEvent } from "./soundManager";

let soundManager: SoundManager;

export function activate(context: vscode.ExtensionContext): void {
  soundManager = new SoundManager(context.extensionPath);

  // Terminal lifecycle events
  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(() => {
      soundManager.play("terminalOpened");
    })
  );

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal(() => {
      soundManager.play("terminalClosed");
    })
  );

  // Shell integration events (VS Code >= 1.93)
  context.subscriptions.push(
    vscode.window.onDidStartTerminalShellExecution(() => {
      soundManager.play("commandStarted");
    })
  );

  context.subscriptions.push(
    vscode.window.onDidEndTerminalShellExecution(async (event) => {
      const exitCode = await event.execution.exitCode;
      if (exitCode === 0) {
        soundManager.play("commandSucceeded");
      } else if (exitCode !== undefined) {
        soundManager.play("commandFailed");
      }
    })
  );

  // Test command
  context.subscriptions.push(
    vscode.commands.registerCommand("terminalSounds.testSounds", async () => {
      const events: SoundEvent[] = [
        "terminalOpened",
        "terminalClosed",
        "commandStarted",
        "commandSucceeded",
        "commandFailed",
      ];
      for (const name of events) {
        vscode.window.showInformationMessage(`Playing: ${name}`);
        soundManager.playForce(name);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    })
  );

  // Reload config on settings change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("terminalSounds")) {
        soundManager.reloadConfig();
      }
    })
  );
}

export function deactivate(): void {
  soundManager?.dispose();
}
