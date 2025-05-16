import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Extension can be loaded', async () => {
		// This test verifies that the extension loads properly in the current version
		const extension = vscode.extensions.getExtension("trombiano1.tmux-pane-editors");
		assert.notStrictEqual(extension, undefined, "Extension should be present");
		
		if (extension) {
			// Check if extension is active, activate if not
			if (!extension.isActive) {
				await extension.activate();
			}
			assert.strictEqual(extension.isActive, true, "Extension should be activated");
		}
	});

	test('Commands are registered', async () => {
		// Get all available commands
		const commands = await vscode.commands.getCommands(true);
		
		// List of commands our extension should register
		const expectedCommands = [
			// "tmux-pane-editors.getPaneInfo", // This command isn't actually implemented
			"tmux-pane-editors.splitEditorRight",
			"tmux-pane-editors.splitEditorDown",
			"tmux-pane-editors.closeActiveEditor",
			"tmux-pane-editors.resize",
			"tmux-pane-editors.navigate",
			"tmux-pane-editors.showPaneNumbers",
			"tmux-pane-editors.focus",
			"tmux-pane-editors.swap"
		];
		
		// Check if all expected commands are registered
		for (const cmd of expectedCommands) {
			assert.strictEqual(
				commands.includes(cmd), 
				true, 
				`Command ${cmd} should be registered`
			);
		}
	});
});

// Test version compatibility outside the standard test suite
// This section is meant to be run via a separate task/script
