import { browser } from 'webextension-polyfill-ts';
import { WebInteractions } from './webInteractions';

console.log('Background script loaded');

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener(async (message, sender) => {
    // Временный XPath для демонстрации (можно изменить под конкретный сайт)
    const DEMO_XPATH = '/html/body/div[1]/div/div/div[2]/header/div/div/div/div[1]/div[3]/a';

    try {
        // Получаем активную вкладку
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (!activeTab || !activeTab.id) {
            console.error('No active tab found');
            return { success: false, error: 'No active tab' };
        }

        console.log(`Attempting to inject content script into tab ${activeTab.id}`);

        // Принудительная инъекция контент-скрипта
        await browser.tabs.executeScript(activeTab.id, {
            file: 'content.js',
            runAt: 'document_start'
        });

        console.log(`Sending message to tab ${activeTab.id}`);

        // Отправляем сообщение контент-скрипту для клика по XPath
        const result = await browser.tabs.sendMessage(activeTab.id, {
            action: 'clickByXPath',
            xpath: DEMO_XPATH
        });

        console.log('Message send result:', JSON.stringify(result));

        return result;
    } catch (error: unknown) {
        console.error('Error in background script:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
});
