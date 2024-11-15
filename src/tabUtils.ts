// Утилиты для работы с вкладками браузера

export interface Tab {
    id?: number;
    windowId?: number;
    url?: string;
    active?: boolean;
}

// Получить активную вкладку в текущем окне
export const getCurrentTab = async (): Promise<Tab | undefined> => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
};

// Активировать вкладку по ID
export const activateTab = async (tabId: number, focusWindow: boolean = false): Promise<Tab> => {
    const tab = await chrome.tabs.get(tabId);
    
    if (focusWindow) {
        await chrome.windows.update(tab.windowId, { focused: true });
    }
    
    await chrome.tabs.update(tab.id, { active: true });
    return tab;
};

// Создать новую вкладку
export const createTab = async (url: string): Promise<Tab> => {
    return await chrome.tabs.create({ url });
};

// Получить вкладку по ID
export const getTab = async (tabId: number): Promise<Tab> => {
    try {
        return await chrome.tabs.get(tabId);
    } catch {
        const tabs = await chrome.tabs.query({ active: true });
        return tabs[0];
    }
};

// Обновить URL вкладки
export const updateUrlForTab = async (tabId: number, url: string): Promise<Tab> => {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tab.id, { url });
    return tab;
};
