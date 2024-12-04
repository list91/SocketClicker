// Удален импорт chrome, используем глобальный объект
// import { chrome } from 'webextension-polyfill-ts';
import { browser } from 'webextension-polyfill-ts';
// Установим начальное значение для автонажатия в chrome.storage.local
chrome.storage.local.set({ autoKeyEnabled: true });
let pressInterval: number | undefined;
/**
 * Набор утилит для расширенных веб-взаимодействий
 */
export class WebInteractions {
    // Объявление переменной для управления интервалом
    static pressInterval: number | undefined;
    static KEYS: string[] = [];
    static getKeyInfo(key: string) {
        const upperKey = key.toUpperCase();
        const keyCode = upperKey.charCodeAt(0);
        return {
            key: key.toLowerCase(), // Lowercase key
            upperKey, // Uppercase key
            keyCode, // Key code
            eventCode: `Key${upperKey}` // Event code
        };
    }
    static async pressKey(tabId: number, keyInfo: typeof this.KEYS.map(this.getKeyInfo)[0]) {
        // console.debug(`[DEBUG] Pressing key: ${keyInfo.key} in tab ${tabId}`);
        
        // Проверяем, включен ли автоввод в localStorage
        const isAutoKeyEnabled = localStorage.getItem('autoKeyEnabled') === 'true';
        
        if (!isAutoKeyEnabled) {
            console.warn('[DEBUG] Auto press is disabled');
            return;
        }
    
        // console.log(`[DEBUG] Preparing to press ${keyInfo.key} key in tab ${tabId}`);
        // TODO: тут остановился адаптируя логику нажатия из ветки new-write-method
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
    static async pressKeySequence(tabId: number) {
        
        console.debug('[DEBUG] Starting key sequence for tab', tabId);
        for (const keyInfo of this.KEYS) {
            await this.pressKey(tabId, keyInfo);
            // Ждем небольшую паузу между нажатиями клавиш
            await new Promise(resolve => setTimeout(resolve, 100));
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

    /**
     * Автоматическое нажатие клавиш из массива символов
     * @param tabId ID вкладки
     * @param keys Массив символов для нажатия
     * @returns Результат выполнения автонажатия
     */
    static async startAutoPress(tabId: number, keys: string[]) {
        this.KEYS = keys;

        console.debug('[DEBUG] Starting auto press for tab', tabId);
    // Проверяем, включен ли автоввод в localStorage
    const isAutoKeyEnabled = localStorage.getItem('autoKeyEnabled') === 'true';
    
    if (!isAutoKeyEnabled) {
        console.log('Auto press is disabled, not starting');
        return;
    }

    if (!pressInterval) {
        console.log('Starting auto-press sequence for tab', tabId);
        await this.pressKeySequence(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => {
            console.log('Repeating key sequence for tab', tabId);
            this.pressKeySequence(tabId);
        }, 2000);
        console.log('Interval ID:', pressInterval);
    } else {
        console.log('Auto-press already running for tab', tabId);
    }
    }
    
}
