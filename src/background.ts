import { browser } from 'webextension-polyfill-ts';
import { KEY_CONFIG, MessageType } from './config';

console.log('Background script loaded');

let pressInterval: number | undefined;

// Функция для эмуляции нажатия клавиши
async function pressKey(tabId: number, keyInfo: typeof KEY_CONFIG.KEYS_INFO[0]) {
    console.log(`Pressing ${keyInfo.key} key in tab ${tabId}`);
    
    try {
        // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
        await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
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
                            // Создаем текстовый узел
                            const textNode = document.createTextNode('${keyInfo.key}');
                            
                            // Пытаемся вставить текст через execCommand
                            document.execCommand('insertText', false, '${keyInfo.key}');
                            
                            // Также пробуем через selection API
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
                    
                    console.log('${keyInfo.key} key press completed');
                })();
            `
        });
    } catch (error) {
        console.error('Error pressing key:', error);
    }
}

// Функция для нажатия последовательности клавиш
async function pressKeySequence(tabId: number) {
    for (const keyInfo of KEY_CONFIG.KEYS_INFO) {
        await pressKey(tabId, keyInfo);
        // Ждем небольшую паузу между нажатиями клавиш
        await new Promise(resolve => setTimeout(resolve, KEY_CONFIG.KEY_SEQUENCE_INTERVAL));
    }
}

// Функция для запуска автонажатия
async function startAutoPress(tabId: number) {
    if (!pressInterval) {
        console.log('Starting auto-press sequence for tab', tabId);
        await pressKeySequence(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => pressKeySequence(tabId), KEY_CONFIG.SEQUENCE_REPEAT_INTERVAL);
        console.log('Interval ID:', pressInterval);
    }
}

// Функция для остановки автонажатия
function stopAutoPress() {
    if (pressInterval) {
        console.log('Stopping auto-press with interval ID:', pressInterval);
        window.clearInterval(pressInterval);
        pressInterval = undefined;
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
    stopAutoPress();
    // Запускаем новый интервал для активной вкладки
    await startAutoPress(activeInfo.tabId);
});

// При обновлении вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log('Active tab updated:', tabId);
        // Останавливаем предыдущий интервал
        stopAutoPress();
        // Запускаем новый интервал для обновленной вкладки
        await startAutoPress(tabId);
    }
});

// Обработчик сообщений
browser.runtime.onMessage.addListener(async (message: MessageType) => {
    console.log('Received message:', message);

    if (message.action === 'toggleAutoPress') {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        if (!tab || !tab.id) {
            console.error('No active tab found');
            return;
        }

        if (message.value) {
            await startAutoPress(tab.id);
        } else {
            stopAutoPress();
        }
    }
});
