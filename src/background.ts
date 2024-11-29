import { browser } from 'webextension-polyfill-ts';
import { KEY_CONFIG, MessageType } from './config';

console.log('Background script loaded');

let pressInterval: number | undefined;

// Функция для эмуляции нажатия клавиши
async function pressKey(tabId: number, keyInfo: typeof KEY_CONFIG.KEYS_INFO[0]) {
    console.debug(`[DEBUG] Pressing key: ${keyInfo.key} in tab ${tabId}`);
    
    // Проверяем, включен ли автоввод в localStorage
    const isAutoKeyEnabled = localStorage.getItem('autoKeyEnabled') === 'true';
    
    if (!isAutoKeyEnabled) {
        console.warn('[DEBUG] Auto press is disabled');
        return;
    }

    console.log(`[DEBUG] Preparing to press ${keyInfo.key} key in tab ${tabId}`);
    
    try {
        // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
        const result = await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    console.debug('[CONTENT] Starting key press simulation for key: ${keyInfo.key}');
                    
                    // Получаем активный элемент
                    const target = document.activeElement;
                    console.debug('[CONTENT] Active element:', target ? target.tagName : 'No active element');
                    
                    // Функция для отправки события
                    function sendKeyEvent(element, eventType, key) {
                        console.debug(\`[CONTENT] Sending \${eventType} event for key: \${key}\`);
                        
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

                        try {
                            element.dispatchEvent(evt);
                            console.debug(\`[CONTENT] Successfully dispatched \${eventType} event\`);
                        } catch (dispatchError) {
                            console.error(\`[CONTENT] Error dispatching \${eventType} event:\`, dispatchError);
                        }
                        
                        return evt;
                    }

                    // Пытаемся определить тип элемента и его поведение
                    if (target) {
                        // Проверяем, является ли элемент текстовым полем
                        const isTextField = target instanceof HTMLInputElement || 
                                         target instanceof HTMLTextAreaElement;

                        console.debug('[CONTENT] Is text field:', isTextField);
                        console.debug('[CONTENT] Is content editable:', target.isContentEditable);

                        // Проверяем редактируемые div-ы (например, contenteditable)
                        if (isTextField || target.isContentEditable || 
                            target.contentEditable === 'true' || 
                            target.classList.contains('public-DraftEditor-content')) {
                            
                            console.debug('[CONTENT] Attempting to insert text');
                            
                            // Пытаемся вставить текст через execCommand
                            const execCommandSuccess = document.execCommand('insertText', false, '${keyInfo.key}');
                            
                            console.debug('[CONTENT] execCommand insertion result:', execCommandSuccess);
                            
                            if (!execCommandSuccess) {
                                // Если execCommand не сработал, используем Selection API
                                console.debug('[CONTENT] Falling back to Selection API');
                                const textNode = document.createTextNode('${keyInfo.key}');
                                const selection = window.getSelection();
                                if (selection && selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0);
                                    range.deleteContents();
                                    range.insertNode(textNode);
                                    range.collapse(false);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                    console.debug('[CONTENT] Successfully inserted text via Selection API');
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
                    console.debug('[CONTENT] Dispatched input event');
                    
                    // Создаем событие change для обновления значения
                    const changeEvent = new Event('change', { bubbles: true, composed: true });
                    target.dispatchEvent(changeEvent);
                    console.debug('[CONTENT] Dispatched change event');
                    
                    console.debug('[CONTENT] Key press simulation completed for key: ${keyInfo.key}');
                    return true;
                })();
            `
        });

        console.log(`[DEBUG] Key press result for ${keyInfo.key}:`, result);
    } catch (error) {
        console.error(`[DEBUG] Error pressing key ${keyInfo.key}:`, error);
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
    console.log('[DEBUG] Completed key sequence for tab', tabId);

    // Wait 1 second before clicking the second button
    console.debug('[DEBUG] Waiting 1 second before clicking second button');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click the second button
    console.debug('[DEBUG] Attempting to click second button');
    await browser.tabs.executeScript(tabId, {
        code: `
            (function() {
                console.debug('[CONTENT] Searching for second button');
                const buttonXPath = '/html/body/div[1]/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]/div[1]/div/div/div/div[2]/div[2]/div/div/div/button[2]';
                const button = document.evaluate(
                    buttonXPath, 
                    document, 
                    null, 
                    XPathResult.FIRST_ORDERED_NODE_TYPE, 
                    null
                ).singleNodeValue;

                if (button) {
                    console.debug('[CONTENT] Second button found, clicking');
                    try {
                        button.click();
                        console.debug('[CONTENT] Second button clicked successfully');
                        return true;
                    } catch (clickError) {
                        console.error('[CONTENT] Error clicking second button:', clickError);
                        return false;
                    }
                } else {
                    console.warn('[CONTENT] Second button not found');
                    return false;
                }
            })();
        `
    });
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

                    if (button) {
                        console.debug('[CONTENT] Attempting to click button');
                        try {
                            button.click();
                            console.debug('[CONTENT] Button clicked successfully');
                            return true;
                        } catch (clickError) {
                            console.error('[CONTENT] Error clicking button:', clickError);
                            return false;
                        }
                    }
                    return false;
                })();
            `
        });

        if (result && result[0] === true) {
            console.log('[DEBUG] Button found and clicked successfully');
            
            // Stop searching after successful button click
            stopButtonSearch();

            // Enable auto press
            console.debug('[DEBUG] Enabling auto press for delayed sequence');
            localStorage.setItem('autoKeyEnabled', 'true');

            // Schedule key sequence after 4 seconds
            setTimeout(async () => {
                console.debug('[DEBUG] Executing delayed key sequence');
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                const tab = tabs[0];

                if (tab && tab.id) {
                    await pressKeySequence(tab.id);
                    // Disable auto press after sequence is complete
                    console.debug('[DEBUG] Disabling auto press after sequence completion');
                    localStorage.setItem('autoKeyEnabled', 'false');
                } else {
                    console.error('[DEBUG] No active tab found for key sequence');
                }
            }, 4000);
        } else {
            console.warn('[DEBUG] Button NOT found or click failed. Continuing search...');
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
