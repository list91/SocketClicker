import { browser } from 'webextension-polyfill-ts';
import { KEY_CONFIG, MessageType } from './config';

console.log('Background script loaded');

let pressInterval: number | null = null;

// Функция для эмуляции нажатия клавиши
async function pressKey(tabId: number) {
    console.log(`Pressing ${KEY_CONFIG.key} key in tab ${tabId}`);
    
    try {
        // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
        await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    // Получаем активный элемент
                    const activeElement = document.activeElement;
                    console.log('Active element:', activeElement);

                    // Функция для отправки события
                    function sendKeyEvent(element, eventType, key) {
                        const evt = new KeyboardEvent(eventType, {
                            key: key,
                            code: '${KEY_CONFIG.eventCode}',
                            keyCode: ${KEY_CONFIG.keyCode},
                            which: ${KEY_CONFIG.keyCode},
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            view: window
                        });
                        
                        // Добавляем дополнительные свойства для некоторых фреймворков
                        Object.defineProperties(evt, {
                            keyCode: { value: ${KEY_CONFIG.keyCode} },
                            which: { value: ${KEY_CONFIG.keyCode} },
                            key: { value: key },
                            code: { value: '${KEY_CONFIG.eventCode}' }
                        });

                        element.dispatchEvent(evt);
                        return evt;
                    }

                    // Определяем цель для событий
                    let target = activeElement;
                    
                    // Если активный элемент внутри iframe или похож на редактор
                    if (activeElement && (
                        activeElement.tagName === 'IFRAME' || 
                        activeElement.getAttribute('role') === 'textbox' ||
                        activeElement.classList.contains('public-DraftEditor-content') ||
                        activeElement.contentEditable === 'true'
                    )) {
                        console.log('Found editor element:', activeElement);
                        
                        // Для contentEditable и DraftJS
                        if (activeElement.contentEditable === 'true' || 
                            activeElement.classList.contains('public-DraftEditor-content')) {
                            // Создаем текстовый узел
                            const textNode = document.createTextNode('${KEY_CONFIG.key}');
                            
                            // Пытаемся вставить текст через execCommand
                            document.execCommand('insertText', false, '${KEY_CONFIG.key}');
                            
                            // Также пробуем через selection API
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(textNode);
                                
                                // Перемещаем курсор в конец
                                range.setStartAfter(textNode);
                                range.setEndAfter(textNode);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        }
                    }

                    // В любом случае отправляем последовательность событий
                    sendKeyEvent(target || document, 'keydown', '${KEY_CONFIG.key}');
                    sendKeyEvent(target || document, 'keypress', '${KEY_CONFIG.key}');
                    sendKeyEvent(target || document, 'input', '${KEY_CONFIG.key}');
                    sendKeyEvent(target || document, 'keyup', '${KEY_CONFIG.key}');
                    
                    // Создаем событие input для обновления значения
                    const inputEvent = new Event('input', { bubbles: true, composed: true });
                    target.dispatchEvent(inputEvent);
                    
                    // Создаем событие change для некоторых фреймворков
                    const changeEvent = new Event('change', { bubbles: true, composed: true });
                    target.dispatchEvent(changeEvent);
                    
                    console.log('${KEY_CONFIG.key} key press completed');
                })();
            `
        });
    } catch (error) {
        console.error('Error during key press:', error);
    }
}

// Функция для запуска интервала
async function startInterval(tabId: number) {
    if (!pressInterval) {
        console.log('Starting auto-press interval for tab', tabId);
        await pressKey(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => pressKey(tabId), KEY_CONFIG.PRESS_INTERVAL);
        console.log('Interval ID:', pressInterval);
    }
}

// Функция для остановки интервала
function stopInterval() {
    if (pressInterval) {
        console.log('Stopping interval:', pressInterval);
        clearInterval(pressInterval);
        pressInterval = null;
    }
}

// При установке или обновлении расширения
browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
});

// Слушаем изменения активной вкладки
browser.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
    // Останавливаем предыдущий интервал
    stopInterval();
    // Запускаем новый интервал для активной вкладки
    await startInterval(activeInfo.tabId);
});

// При обновлении вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log('Active tab updated:', tabId);
        // Останавливаем предыдущий интервал
        stopInterval();
        // Запускаем новый интервал для обновленной вкладки
        await startInterval(tabId);
    }
});

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener(async (message: MessageType) => {
    console.log('Background received message:', message);
    
    if (message.action === 'toggleAutoPress') {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            if (message.value) {
                await startInterval(tabs[0].id);
            } else {
                stopInterval();
            }
        }
    }
    
    return Promise.resolve({ success: true });
});
