export interface ExtensionState {
    enabled: boolean;
}

export async function getState(): Promise<ExtensionState> {
    const result = await chrome.storage.local.get(['enabled']);
    return {
        enabled: result.enabled ?? false
    };
}

export async function setState(state: Partial<ExtensionState>): Promise<void> {
    await chrome.storage.local.set(state);
    await updateBadge();
}

export async function updateBadge() {
    const state = await getState();
    try {
        const text = state.enabled ? "ON" : "OFF";
        const color = state.enabled ? "#4CAF50" : "#F44336";
        
        await chrome.action.setBadgeText({ text });
        await chrome.action.setBadgeBackgroundColor({ color });
    } catch (error) {
        console.error('Error setting badge text:', error);
    }
}

export function setBadgeText(enabled: boolean) {
    try {
        const text = enabled ? "ON" : "OFF"
        const color = enabled ? "#4CAF50" : "#F44336"
        
        chrome.action.setBadgeText({ text }).catch(console.error)
        chrome.action.setBadgeBackgroundColor({ color }).catch(console.error)
    } catch (error) {
        console.error('Error setting badge text:', error)
    }
}
