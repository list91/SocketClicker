import { browser } from 'webextension-polyfill-ts';
import { WebInteractions } from './webInteractions';

console.log('Content script loaded');

// Функция для безопасного выполнения XPath клика
async function safeXPathClick(xpath: string) {
    try {
        console.log(`Attempting to click XPath: ${xpath}`);
        
        const xpathResult = document.evaluate(
            xpath, 
            document, 
            null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
        );

        const element = xpathResult.singleNodeValue as HTMLElement;

        if (!element) {
            console.error('No element found by XPath');
            return { 
                success: false, 
                error: 'No element found',
                details: {
                    currentUrl: document.location.href,
                    documentReadyState: document.readyState
                }
            };
        }

        // Прокрутка к элементу
        (element as HTMLElement).scrollIntoView({ behavior: 'auto', block: 'center' });

        // Симуляция клика
        const mouseEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(mouseEvent);

        return { 
            success: true, 
            message: 'Element clicked successfully',
            details: {
                tagName: (element as HTMLElement).tagName,
                currentUrl: document.location.href
            }
        };
    } catch (error) {
        console.error('Error in XPath click:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: {
                currentUrl: document.location.href
            }
        };
    }
}

// Установка слушателя сообщений с расширенной обработкой
function setupMessageListener() {
    console.log('Setting up message listener in content script');
    
    browser.runtime.onMessage.addListener(async (message: { action: string; value?: boolean; text?: string; xpath?: string }) => {
        console.log('Content script received message:', JSON.stringify(message));
        
        try {
            if (message.action === 'clickByXPath' && message.xpath) {
                console.log(`Processing XPath click: ${message.xpath}`);
                return await safeXPathClick(message.xpath);
            }
            
            return { success: false, error: 'Unknown action' };
        } catch (error) {
            console.error('Error in message handler:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    });
}

// Инициализация при загрузке документа
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMessageListener);
} else {
    setupMessageListener();
}

console.log('Content script initialization complete');
