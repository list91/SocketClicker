import { browser } from 'webextension-polyfill-ts';
import { KEY_CONFIG, MessageType } from './config';

console.log('Background script loaded');

let pressInterval: number | undefined;

// Функция для эмуляции нажатия клавиши
async function pressKey(tabId: number, keyInfo: typeof KEY_CONFIG.KEYS_INFO[0]) {
    console.debug('[DEBUG] Pressing key:', keyInfo.key);
    // Проверяем, включен ли автоввод в localStorage
    const isAutoKeyEnabled = localStorage.getItem('autoKeyEnabled') === 'true';
    
    if (!isAutoKeyEnabled) {
        console.log('Auto press is disabled');
        return;
    }

    console.log(`Pressing ${keyInfo.key} key in tab ${tabId}`);
    
    try {
        // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
        await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    console.debug('[CONTENT] Simulating key press:', '${keyInfo.key}');
                    // Получаем активный элемент
                    const target = document.activeElement;
                    
                    // Функция для отправки события
                    function sendKeyEvent(element, eventType, key) {
                        const evt = new KeyboardEvent(eventType, {
                            key: key,
                            code: '${keyInfo.eventCode}',
                            keyCode: ${keyInfo.keyCode},
                            which: ${keyInfo.keyCode},
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            view: window
                        });
                        
                        // Добавляем дополнительные свойства для некоторых фреймворков
                        Object.defineProperties(evt, {
                            keyCode: { value: ${keyInfo.keyCode} },
                            which: { value: ${keyInfo.keyCode} },
                            key: { value: key },
                            code: { value: '${keyInfo.eventCode}' }
                        });

                        element.dispatchEvent(evt);
                        return evt;
                    }

                    // Пытаемся определить тип элемента и его поведение
                    if (target) {
                        // Проверяем, является ли элемент текстовым полем
                        const isTextField = target instanceof HTMLInputElement || 
                                         target instanceof HTMLTextAreaElement;

                        // Проверяем редактируемые div-ы (например, contenteditable)
                        if (isTextField || target.isContentEditable || 
                            target.contentEditable === 'true' || 
                            target.classList.contains('public-DraftEditor-content')) {
                            // Пытаемся вставить текст через execCommand
                            const execCommandSuccess = document.execCommand('insertText', false, '${keyInfo.key}');
                            
                            if (!execCommandSuccess) {
                                // Если execCommand не сработал, используем Selection API
                                const textNode = document.createTextNode('${keyInfo.key}');
                                const selection = window.getSelection();
                                if (selection && selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0);
                                    range.deleteContents();
                                    range.insertNode(textNode);
                                    range.collapse(false);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }
                            }
                        }
                    }

                    // В любом случае отправляем последовательность событий
                    sendKeyEvent(target || document, 'keydown', '${keyInfo.key}');
                    sendKeyEvent(target || document, 'keypress', '${keyInfo.key}');
                    sendKeyEvent(target || document, 'input', '${keyInfo.key}');
                    sendKeyEvent(target || document, 'keyup', '${keyInfo.key}');
                    
                    // Создаем событие input для обновления значения
                    const inputEvent = new Event('input', { bubbles: true, composed: true });
                    target.dispatchEvent(inputEvent);
                    
                    // Создаем событие change для обновления значения
                    const changeEvent = new Event('change', { bubbles: true, composed: true });
                    target.dispatchEvent(changeEvent);
                    
                    console.debug('[CONTENT] Key press completed');
                })();
            `
        });
    } catch (error) {
        console.error('Error pressing key:', error);
    }
}

// Функция для нажатия последовательности клавиш
async function pressKeySequence(tabId: number) {
    console.debug('[DEBUG] Starting key sequence for tab', tabId);
    for (const keyInfo of KEY_CONFIG.KEYS_INFO) {
        await pressKey(tabId, keyInfo);
        // Ждем небольшую паузу между нажатиями клавиш
        await new Promise(resolve => setTimeout(resolve, KEY_CONFIG.KEY_SEQUENCE_INTERVAL));
    }
    console.log('Completed key sequence for tab', tabId);
}

// Функция для запуска автонажатия
async function startAutoPress(tabId: number) {
    console.debug('[DEBUG] Starting auto press for tab', tabId);
    // Проверяем, включен ли автоввод в localStorage
    const isAutoKeyEnabled = localStorage.getItem('autoKeyEnabled') === 'true';
    
    if (!isAutoKeyEnabled) {
        console.log('Auto press is disabled, not starting');
        return;
    }

    if (!pressInterval) {
        console.log('Starting auto-press sequence for tab', tabId);
        await pressKeySequence(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => {
            console.log('Repeating key sequence for tab', tabId);
            pressKeySequence(tabId);
        }, KEY_CONFIG.SEQUENCE_REPEAT_INTERVAL);
        console.log('Interval ID:', pressInterval);
    } else {
        console.log('Auto-press already running for tab', tabId);
    }
}

// Функция для остановки автонажатия
function stopAutoPress() {
    console.debug('[DEBUG] Stopping auto press');
    if (pressInterval) {
        console.log('Stopping auto-press with interval ID:', pressInterval);
        window.clearInterval(pressInterval);
        pressInterval = undefined;
    }
}

// Function to search for the specific button
async function searchForButton() {
    console.debug('[DEBUG] Starting button search process');
    try {
        console.debug('[DEBUG] Querying active tabs');
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        if (!tab || !tab.id) {
            console.error('[DEBUG] No active tab found');
            return;
        }

        console.debug(`[DEBUG] Active tab ID: ${tab.id}, URL: ${tab.url}`);

        const result = await browser.tabs.executeScript(tab.id, {
            code: `
                (function() {
                    console.debug('[CONTENT] Searching for button with XPath');
                    const buttonXPath = '/html/body/div[1]/div/div/div[2]/header/div/div/div/div[1]/div[3]/a';
                    const button = document.evaluate(
                        buttonXPath, 
                        document, 
                        null, 
                        XPathResult.FIRST_ORDERED_NODE_TYPE, 
                        null
                    ).singleNodeValue;

                    console.debug('[CONTENT] XPath search result:', !!button);

                    return {
                        found: !!button,
                        buttonText: button ? button.textContent : null,
                        buttonAttributes: button ? {
                            href: button.getAttribute('href'),
                            className: button.className,
                            id: button.id
                        } : null
                    };
                })();
            `
        });

        if (result && result[0]) {
            const buttonInfo = result[0];
            if (buttonInfo.found) {
                console.log('[DEBUG] Button FOUND! Details:', {
                    text: buttonInfo.buttonText,
                    href: buttonInfo.buttonAttributes?.href,
                    className: buttonInfo.buttonAttributes?.className,
                    id: buttonInfo.buttonAttributes?.id
                });
            } else {
                console.warn('[DEBUG] Button NOT found. Continuing search...');
            }
        } else {
            console.warn('[DEBUG] No result returned from button search');
        }
    } catch (error) {
        console.error('[DEBUG] Error in button search:', error);
    }
}

// Start periodic button search
let buttonSearchInterval: number | undefined;

function startButtonSearch() {
    console.debug('[DEBUG] Attempting to start button search');
    if (!buttonSearchInterval) {
        console.log('[DEBUG] Starting periodic button search every 2 seconds');
        buttonSearchInterval = window.setInterval(() => {
            console.debug('[DEBUG] Periodic button search tick');
            searchForButton();
        }, 2000);
        console.log(`[DEBUG] Button search interval started with ID: ${buttonSearchInterval}`);
    } else {
        console.warn('[DEBUG] Button search already running');
    }
}

function stopButtonSearch() {
    console.debug('[DEBUG] Attempting to stop button search');
    if (buttonSearchInterval) {
        console.log(`[DEBUG] Stopping button search, interval ID: ${buttonSearchInterval}`);
        window.clearInterval(buttonSearchInterval);
        buttonSearchInterval = undefined;
        console.log('[DEBUG] Button search stopped');
    } else {
        console.warn('[DEBUG] No active button search to stop');
    }
}

// Enhance existing message listener with debug logging
browser.runtime.onMessage.addListener(async (message: MessageType) => {
    console.debug('[DEBUG] Received runtime message:', message);

    if (message.action === 'toggleAutoPress') {
        console.debug('[DEBUG] Toggle auto press received');
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        if (!tab || !tab.id) {
            console.error('[DEBUG] No active tab found for auto press');
            return;
        }

        if (message.value) {
            console.log('[DEBUG] Starting auto press');
            await startAutoPress(tab.id);
        } else {
            console.log('[DEBUG] Stopping auto press');
            stopAutoPress();
        }
    }

    // Enhanced button search toggle
    if (message.action === 'toggleButtonSearch') {
        console.debug('[DEBUG] Toggle button search received');
        if (message.value) {
            console.log('[DEBUG] Enabling button search');
            startButtonSearch();
        } else {
            console.log('[DEBUG] Disabling button search');
            stopButtonSearch();
        }
    }
});

// Start button search when extension is loaded with debug info
console.debug('[DEBUG] Extension background script initializing');
startButtonSearch();
console.debug('[DEBUG] Extension background script initialization complete');

// При установке или обновлении расширения
browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    console.debug('[DEBUG] Extension installed/updated');
    // Сбрасываем состояние автонажатия при установке
    localStorage.removeItem('autoKeyEnabled');
});

// Слушаем изменения активной вкладки
browser.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
    console.debug('[DEBUG] Tab activated:', activeInfo.tabId);
    // Останавливаем предыдущий интервал
    stopAutoPress();
    // Запускаем новый интервал для активной вкладки
    await startAutoPress(activeInfo.tabId);
});

// При обновлении вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log('Active tab updated:', tabId);
        console.debug('[DEBUG] Active tab updated:', tabId);
        // Останавливаем предыдущий интервал
        stopAutoPress();
        // Запускаем новый интервал для обновленной вкладки
        await startAutoPress(tabId);
    }
});
