// Интерфейс для команды
interface Command {
    id: string;
    type: string;
    xpath?: string;
    value?: string;
}

// Интерфейс для сообщений
interface BackgroundMessage {
    type: string;
    enabled?: boolean;
    command?: Command;
}

// Интерфейс для ответов
interface BackgroundResponse {
    enabled?: boolean;
    success?: boolean;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message);
    console.log('[Background] From sender:', sender);
    sendResponse({ success: true });
    console.log('[Background] Sent response: success');
    return true;
});
