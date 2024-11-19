// Интерфейс для команды
interface Command {
    type: string;
    xpath?: string;
    value?: string;
}

// Интерфейс для ответа
interface CommandResponse {
    success: boolean;
}

// Интерфейс для сообщения
interface Message {
    type: string;
    command?: Command;
    enabled?: boolean;
}

console.log('[Content] Script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content] Received message:', message);
    console.log('[Content] From sender:', sender);
    sendResponse({ success: true });
    console.log('[Content] Sent response: success');
    return true;
});
