import * as vscode from 'vscode';

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
function getGroupsAtPath(layoutGroups: EditorGroup[], path: number[]): EditorGroup[] {
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
function getVerticalResizeAction(activePath: number[], layoutGroups: EditorGroup[]): 'expand' | 'shrink' | null {
    for (let depth = activePath.length; depth >= 1; depth--) {
        if (depth % 2 === 0) { // even depth => vertical container
            const parentPath = activePath.slice(0, depth - 1);
            const parentGroups = getGroupsAtPath(layoutGroups, parentPath);
            const indexInParent = activePath[depth - 1];
            if (indexInParent === parentGroups.length - 1) {
                return 'shrink';
            } else {
                return 'expand';
            }
        }
    }
    return null;
}

// Determine the resize action for horizontal (left/right) commands.
function getHorizontalResizeAction(activePath: number[], layoutGroups: EditorGroup[]): 'expand' | 'shrink' | null {
    for (let depth = activePath.length; depth >= 1; depth--) {
        if (depth % 2 === 1) { // odd depth => horizontal container
            const parentPath = activePath.slice(0, depth - 1);
            const parentGroups = getGroupsAtPath(layoutGroups, parentPath);
            const indexInParent = activePath[depth - 1];
            if (indexInParent === parentGroups.length - 1) {
                return 'shrink';
            } else {
                return 'expand';
            }
        }
    }
    return null;
}

// Retrieve the active pane's path from the flattened layout.
async function getActivePanePath(): Promise<number[] | null> {
    const layout = await vscode.commands.executeCommand('vscode.getEditorLayout') as EditorLayout;
    if (!layout || !layout.groups) {
        return null;
    }
    const panes = flattenGroups(layout.groups);
    const groups = vscode.window.tabGroups.all;
    const activeIndex = groups.findIndex(g => g.isActive);
    if (activeIndex < 0 || activeIndex >= panes.length) {
        return null;
    }
    return panes[activeIndex].path;
}

export function activate(context: vscode.ExtensionContext) {
    // Track tmux mode and a timer to turn it off
    let tmuxMode = false;
    let tmuxTimeout: NodeJS.Timeout | null = null;

    // Helper to reset the timer: clears any previous timer and starts a new 1-second timeout.
    function resetTmuxTimeout() {
        if (tmuxTimeout) {
            clearTimeout(tmuxTimeout);
        }
        tmuxTimeout = setTimeout(() => {
            tmuxMode = false;
            vscode.commands.executeCommand('setContext', 'tmuxMode', false);
            vscode.window.setStatusBarMessage("Tmux Mode", 1000);
        }, 1000);
    }

    // Toggle tmux mode on, and start the 1-sec auto-off timer.
    let toggleTmuxMode = vscode.commands.registerCommand('tmux-like-editors.toggleTmuxMode', () => {
        tmuxMode = true;
        vscode.commands.executeCommand('setContext', 'tmuxMode', true);
        vscode.window.setStatusBarMessage("Tmux Mode", 1000);
        resetTmuxTimeout();
    });

    let resizeDown = vscode.commands.registerCommand('tmux-like-editors.resizeDown', async () => {
        // If in tmux mode, reset the timeout so that the timer starts over.
        if (tmuxMode) {
            resetTmuxTimeout();
        }
        const groups = vscode.window.tabGroups.all;
        if (groups.length < 2) { return; }
        const activePath = await getActivePanePath();
        if (!activePath) { return; }

        const layout = await vscode.commands.executeCommand('vscode.getEditorLayout') as EditorLayout;
        const action = getVerticalResizeAction(activePath, layout.groups);
        if (action === 'expand') {
            vscode.commands.executeCommand('workbench.action.increaseViewHeight');
        } else if (action === 'shrink') {
            vscode.commands.executeCommand('workbench.action.decreaseViewHeight');
        }
    });

    let resizeUp = vscode.commands.registerCommand('tmux-like-editors.resizeUp', async () => {
        if (tmuxMode) {
            resetTmuxTimeout();
        }
        const groups = vscode.window.tabGroups.all;
        if (groups.length < 2) { return; }
        const activePath = await getActivePanePath();
        if (!activePath) { return; }

        const layout = await vscode.commands.executeCommand('vscode.getEditorLayout') as EditorLayout;
        // For up arrow the logic is inverted.
        const verticalAction = getVerticalResizeAction(activePath, layout.groups);
        if (verticalAction === 'expand') {
            vscode.commands.executeCommand('workbench.action.decreaseViewHeight');
        } else if (verticalAction === 'shrink') {
            vscode.commands.executeCommand('workbench.action.increaseViewHeight');
        }
    });

    let resizeRight = vscode.commands.registerCommand('tmux-like-editors.resizeRight', async () => {
        if (tmuxMode) {
            resetTmuxTimeout();
        }
        const groups = vscode.window.tabGroups.all;
        if (groups.length < 2) { return; }
        const activePath = await getActivePanePath();
        if (!activePath) { return; }

        const layout = await vscode.commands.executeCommand('vscode.getEditorLayout') as EditorLayout;
        const action = getHorizontalResizeAction(activePath, layout.groups);
        if (action === 'expand') {
            vscode.commands.executeCommand('workbench.action.increaseViewWidth');
        } else if (action === 'shrink') {
            vscode.commands.executeCommand('workbench.action.decreaseViewWidth');
        }
    });

    let resizeLeft = vscode.commands.registerCommand('tmux-like-editors.resizeLeft', async () => {
        if (tmuxMode) {
            resetTmuxTimeout();
        }
        const groups = vscode.window.tabGroups.all;
        if (groups.length < 2) { return; }
        const activePath = await getActivePanePath();
        if (!activePath) { return; }

        const layout = await vscode.commands.executeCommand('vscode.getEditorLayout') as EditorLayout;
        // For left arrow, invert the horizontal logic.
        const horizontalAction = getHorizontalResizeAction(activePath, layout.groups);
        if (horizontalAction === 'expand') {
            vscode.commands.executeCommand('workbench.action.decreaseViewWidth');
        } else if (horizontalAction === 'shrink') {
            vscode.commands.executeCommand('workbench.action.increaseViewWidth');
        }
    });

    context.subscriptions.push(toggleTmuxMode, resizeDown, resizeUp, resizeRight, resizeLeft);
}

export function deactivate() {
    // Optional: if desired, clear the timer on deactivation.
    vscode.commands.executeCommand('setContext', 'tmuxMode', false);
}
