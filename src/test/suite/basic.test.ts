import * as assert from "assert";
import * as vscode from "vscode";
import * as mocha from 'mocha';

// Use the mocha functions from the mocha module
const { suite, test } = mocha;

suite("Basic Functionality", () => {
  test("Extension is present", async function() {
    const extension = vscode.extensions.getExtension("trombiano1.tmux-pane-editors");
    assert.notStrictEqual(extension, undefined, "Extension should be present");
  });

  test("Extension can be activated", async function() {
    this.timeout(10000); // Allow more time for activation

    const extension = vscode.extensions.getExtension("trombiano1.tmux-pane-editors");
    assert.notStrictEqual(extension, undefined, "Extension should be present");
    
    if (extension) {
      if (!extension.isActive) {
        await extension.activate();
      }
      assert.strictEqual(extension.isActive, true, "Extension should be activated");
    }
  });

  test("Commands are registered", async function() {
    // Get all available commands
    const commands = await vscode.commands.getCommands(true);
    
    // Check for at least one of our extension's commands
    assert.strictEqual(
      commands.includes("tmux-pane-editors.navigate"), 
      true, 
      "Navigate command should be registered"
    );
  });
}); 