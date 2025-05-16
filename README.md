# TPE: tmux pane editors

![](tpe.gif)

## Overview
The idea is to treat each editor as if they were tmux panes.

### Features
Supports most tmux keybindings related to panes including but not limited to:
  - Pane resizing
  - Displaying pane numbers
  - Sticky leader keys

## Setup
Paste this into your `config.json` so that the terminals can avoid capturing commands:
```
"terminal.integrated.commandsToSkipShell": [
  "tmux-pane-editors.toggleTmuxMode",
  "tmux-pane-editors.navigate",
  "tmux-pane-editors.resize",
  "workbench.action.closeActiveEditor"
]
```

## Keybindings
|    Keybinding     |                Command               |
|:------------------|:-------------------------------------|
| `Ctrl+b arrow`<sup>(1)</sup>    | Navigate editors                     |
| `Ctrl+b o`        | Next editor                          |
| `Ctrl+b ;`        | Previous editor                      |
| `Ctrl+b q`        | Show pane numbers                    |
| `Ctrl+b %`        | Split editor right                   |
| `Ctrl+b '`        | Split editor down                    |
| `Ctrl+b x`        | Close active editor                  |
| `Ctrl+b Alt+arrow`<sup>(2)</sup>| Resize editor                        |
| `Ctrl+b [1-9]`    | Focus on a specific pane             |
| `Ctrl+b }`        | Swap editor to the right             |
| `Ctrl+b {`        | Swap editor to the left              |

(1) Does _not_ support sticky leader keys due to limitations for extensions in VSCode. If you want to spam it please remap `tmux-pane-editors.navigate` to other keybindings.

(2) _Does_ support sticky leader keys.

# Commands
This extension provides these new commands that can be executed via the command palette. You can also remap these to other keybindings.
- Tmux Pane Editors: Close Active Editor
- Tmux Pane Editors: Resize
- Tmux Pane Editors: Navigate
- Tmux Pane Editors: Show Pane Numbers
- Tmux Pane Editors: Focus
- Tmux Pane Editors: Swap

## Development

### Testing Version Compatibility
This extension includes tests to verify compatibility with different VS Code versions. To run these tests:

1. Compile the test code:
   ```
   npm run compile-tests
   ```

2. Run the version compatibility tests:
   ```
   npm run test:compatibility
   ```

These tests will verify that the extension installs and functions correctly on multiple VS Code versions, including:
- The minimum supported version (1.96.0)
- Newer releases
- The latest Insiders build

The test results will show whether the extension is compatible with each tested version.

## License
This extension is licensed under the **MIT License**.