import { browser } from 'webextension-polyfill-ts';

console.log('Background script loaded');

let pressInterval: number | null = null;

// Функция для эмуляции нажатия клавиши Q
async function pressQ(tabId: number) {
    console.log(`Pressing Q key in tab ${tabId}`);
    
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
                            code: 'KeyQ',
                            keyCode: 81,
                            which: 81,
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            view: window
                        });
                        
                        // Добавляем дополнительные свойства для некоторых фреймворков
                        Object.defineProperties(evt, {
                            keyCode: { value: 81 },
                            which: { value: 81 },
                            key: { value: key },
                            code: { value: 'KeyQ' }
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
                            const textNode = document.createTextNode('q');
                            
                            // Пытаемся вставить текст через execCommand
                            document.execCommand('insertText', false, 'q');
                            
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
                    sendKeyEvent(target || document, 'keydown', 'q');
                    sendKeyEvent(target || document, 'keypress', 'q');
                    sendKeyEvent(target || document, 'input', 'q');
                    sendKeyEvent(target || document, 'keyup', 'q');
                    
                    // Создаем событие input для обновления значения
                    const inputEvent = new Event('input', { bubbles: true, composed: true });
                    target.dispatchEvent(inputEvent);
                    
                    // Создаем событие change для некоторых фреймворков
                    const changeEvent = new Event('change', { bubbles: true, composed: true });
                    target.dispatchEvent(changeEvent);
                    
                    console.log('Q key press completed');
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
        await pressQ(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => pressQ(tabId), 2000);
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
    // Автоматически запускаем для активной вкладки
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0] && tabs[0].id) {
            startInterval(tabs[0].id);
        }
    });
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
browser.runtime.onMessage.addListener(async (message: { action: string; value?: boolean; type?: string; data?: any }) => {
    console.log('Background received message:', message);
    
    if (message.action === 'toggleAutoQ') {
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
