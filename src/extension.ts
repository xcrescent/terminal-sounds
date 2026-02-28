import * as vscode from "vscode";
import { SoundManager, SoundEvent, CommandCategory } from "./soundManager";

let soundManager: SoundManager;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("Terminal Sounds");
  soundManager = new SoundManager(context.extensionPath);

  outputChannel.appendLine("Terminal Sounds activated");

  // Terminal lifecycle events
  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(() => {
      outputChannel.appendLine("Event: terminal opened");
      soundManager.play("terminalOpened");
    })
  );

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal(() => {
      outputChannel.appendLine("Event: terminal closed");
      soundManager.play("terminalClosed");
    })
  );

  // Shell integration events (VS Code >= 1.93)
  if (vscode.window.onDidStartTerminalShellExecution) {
    outputChannel.appendLine("Shell integration API available");

    context.subscriptions.push(
      vscode.window.onDidStartTerminalShellExecution((event) => {
        outputChannel.appendLine(
          `Event: command started — ${event.execution.commandLine?.value ?? "(unknown)"}`
        );
        soundManager.play("commandStarted");
      })
    );

    context.subscriptions.push(
      vscode.window.onDidEndTerminalShellExecution((event) => {
        const exitCode = event.exitCode;
        const commandLine = event.execution.commandLine?.value ?? "";
        outputChannel.appendLine(`Event: command ended — "${commandLine}" exitCode=${exitCode}`);

        // Check for command-specific sound (overrides generic success/fail)
        const category = soundManager.matchCommand(commandLine);
        if (category && exitCode === 0) {
          outputChannel.appendLine(`  Matched category: ${category}`);
          soundManager.playCommand(category);
          return;
        }

        // Fall back to generic success/fail
        if (exitCode === 0) {
          soundManager.play("commandSucceeded");
        } else if (exitCode !== undefined) {
          soundManager.play("commandFailed");
        }
      })
    );
  } else {
    outputChannel.appendLine(
      "Shell integration API NOT available — command sounds will not work. " +
        "Ensure terminal.integrated.shellIntegration.enabled is true."
    );
  }

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
      const categories: CommandCategory[] = ["git", "package", "build", "navigation"];
      for (const cat of categories) {
        vscode.window.showInformationMessage(`Playing: cmd-${cat}`);
        soundManager.playForceCommand(cat);
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
