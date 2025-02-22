import * as vscode from "vscode";

interface EditorGroup {
  size: number;
  groups?: EditorGroup[];
}

interface EditorLayout {
  groups: EditorGroup[];
}

interface PaneInfo {
  group: EditorGroup;
  // The path shows the index at each level (e.g. [2, 1, 0])
  path: number[];
}

// Recursively flatten the layout tree to map each pane to its path
function flattenGroups(groups: EditorGroup[], path: number[] = []): PaneInfo[] {
  let panes: PaneInfo[] = [];
  groups.forEach((group, index) => {
    const currentPath = [...path, index];
    // If this group is split further, flatten its children.
    if (group.groups) {
      panes = panes.concat(flattenGroups(group.groups, currentPath));
    } else {
      panes.push({ group, path: currentPath });
    }
  });
  return panes;
}

// Helper: Given a path, retrieve the groups array at that level
function getGroupsAtPath(
  layoutGroups: EditorGroup[],
  path: number[]
): EditorGroup[] {
  let currentGroups = layoutGroups;
  for (const idx of path) {
    const group = currentGroups[idx];
    if (group.groups) {
      currentGroups = group.groups;
    } else {
      break;
    }
  }
  return currentGroups;
}

// Determine the appropriate resize action for a vertical (up/down) command.
function getVerticalResizeAction(
  activePath: number[],
  layoutGroups: EditorGroup[]
): "expand" | "shrink" | null {
  for (let depth = activePath.length; depth >= 1; depth--) {
    if (depth % 2 === 0) {
      // even depth => vertical container
      const parentPath = activePath.slice(0, depth - 1);
      const parentGroups = getGroupsAtPath(layoutGroups, parentPath);
      const indexInParent = activePath[depth - 1];
      if (indexInParent === parentGroups.length - 1) {
        return "shrink";
      } else {
        return "expand";
      }
    }
  }
  return null;
}

// Determine the resize action for horizontal (left/right) commands.
function getHorizontalResizeAction(
  activePath: number[],
  layoutGroups: EditorGroup[]
): "expand" | "shrink" | null {
  for (let depth = activePath.length; depth >= 1; depth--) {
    if (depth % 2 === 1) {
      // odd depth => horizontal container
      const parentPath = activePath.slice(0, depth - 1);
      const parentGroups = getGroupsAtPath(layoutGroups, parentPath);
      const indexInParent = activePath[depth - 1];
      if (indexInParent === parentGroups.length - 1) {
        return "shrink";
      } else {
        return "expand";
      }
    }
  }
  return null;
}

// Retrieve the active pane's path from the flattened layout.
async function getActivePanePath(): Promise<number[] | null> {
  const layout = (await vscode.commands.executeCommand(
    "vscode.getEditorLayout"
  )) as EditorLayout;
  if (!layout || !layout.groups) {
    return null;
  }
  const panes = flattenGroups(layout.groups);
  const groups = vscode.window.tabGroups.all;
  const activeIndex = groups.findIndex((g) => g.isActive);
  if (activeIndex < 0 || activeIndex >= panes.length) {
    return null;
  }
  return panes[activeIndex].path;
}

export function activate(context: vscode.ExtensionContext) {
  // Track tmux mode and a timer to turn it off
  let tmuxMode = false;
  const tmuxStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  tmuxStatusBarItem.text = "tmux";
  function setTmuxMode(enabled: boolean) {
    tmuxMode = enabled;
    vscode.commands.executeCommand("setContext", "tmuxMode", enabled);
    enabled ? tmuxStatusBarItem.show() : tmuxStatusBarItem.hide();
  }

  let tmuxTimeout: NodeJS.Timeout | null = null;

  // Helper to reset the timer: clears any previous timer and starts a new 1-second timeout.
  function resetTmuxTimeout() {
    if (tmuxTimeout) {
      clearTimeout(tmuxTimeout);
    }
    tmuxTimeout = setTimeout(() => {
      setTmuxMode(false);
    }, 1000);
  }

  let splitEditorRight = vscode.commands.registerCommand(
    "tmux-pane-editors.splitEditorRight",
    () => {
      vscode.commands.executeCommand("workbench.action.newGroupRight");
      vscode.commands.executeCommand("workbench.action.createTerminalEditor");
      setTmuxMode(false);
    }
  );

  let splitEditorDown = vscode.commands.registerCommand(
    "tmux-pane-editors.splitEditorDown",
    () => {
      vscode.commands.executeCommand("workbench.action.newGroupBelow");
      vscode.commands.executeCommand("workbench.action.createTerminalEditor");
      setTmuxMode(false);
    }
  );

  let closeActiveEditor = vscode.commands.registerCommand(
    "tmux-pane-editors.closeActiveEditor",
    async () => {
      vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      setTmuxMode(false);
    }
  );

  let navigate = vscode.commands.registerCommand(
    "tmux-pane-editors.navigate",
    async (direction: 'up' | 'down' | 'left' | 'right') => {
      if (tmuxMode) {
        resetTmuxTimeout();
      } else {
        setTmuxMode(true);
      }
      switch (direction) {
        case "up":
          vscode.commands.executeCommand("workbench.action.navigateUp");
          break;
        case "down":
          vscode.commands.executeCommand("workbench.action.navigateDown");
          break;
        case "left":
          vscode.commands.executeCommand("workbench.action.navigateLeft");
          break;
        case "right":
          vscode.commands.executeCommand("workbench.action.navigateRight");
          break;
      }
    }
  );

  let resize = vscode.commands.registerCommand(
    "tmux-pane-editors.resize",
    async (direction: 'up' | 'down' | 'left' | 'right') => {
      if (tmuxMode) {
        resetTmuxTimeout();
      } else {
        setTmuxMode(true);
      }
      const groups = vscode.window.tabGroups.all;
      if (groups.length < 2) {
        return;
      }
      const activePath = await getActivePanePath();
      if (!activePath) {
        return;
      }
      const layout = (await vscode.commands.executeCommand("vscode.getEditorLayout")) as EditorLayout;
      let commandToRun: string | null = null;

      if (direction === "up" || direction === "down") {
        const verticalAction = getVerticalResizeAction(activePath, layout.groups);
        if (!verticalAction) {
          return;
        }
        // For "down", use the natural action; for "up", invert it.
        if (direction === "down") {
          commandToRun = verticalAction === "expand"
            ? "workbench.action.increaseViewHeight"
            : "workbench.action.decreaseViewHeight";
        } else {
          commandToRun = verticalAction === "expand"
            ? "workbench.action.decreaseViewHeight"
            : "workbench.action.increaseViewHeight";
        }
      } else if (direction === "left" || direction === "right") {
        const horizontalAction = getHorizontalResizeAction(activePath, layout.groups);
        if (!horizontalAction) {
          return;
        }
        // For "right", use the natural action; for "left", invert it.
        if (direction === "right") {
          commandToRun = horizontalAction === "expand"
            ? "workbench.action.increaseViewWidth"
            : "workbench.action.decreaseViewWidth";
        } else {
          commandToRun = horizontalAction === "expand"
            ? "workbench.action.decreaseViewWidth"
            : "workbench.action.increaseViewWidth";
        }
      }
      if (commandToRun) {
        vscode.commands.executeCommand(commandToRun);
      }
    }
  );
  
  context.subscriptions.push(
    splitEditorRight,
    splitEditorDown,
    closeActiveEditor,
    navigate,
    resize
  );
}

export function deactivate() {
  // Optional: if desired, clear the timer on deactivation.
  vscode.commands.executeCommand("setContext", "tmuxMode", false);
}
