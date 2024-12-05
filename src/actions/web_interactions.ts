// Удален импорт chrome, используем глобальный объект
// import { chrome } from 'webextension-polyfill-ts';
// Установим начальное значение для автонажатия в chrome.storage.local
// chrome.storage.local.set({ autoKeyEnabled: true });
let pressInterval: number | undefined;
let tabId: number | undefined;
/**
 * Набор утилит для расширенных веб-взаимодействий
 */
interface KeyInfoType {
    key: string;
    upperKey: string;
    keyCode: number;
    eventCode: string;
}
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
    static async pressKey(tabId: number, keyInfo: KeyInfoType) {
        // console.debug(`[DEBUG] Pressing key: ${keyInfo.key} in tab ${tabId}`);
        
        // Проверяем, включен ли автоввод в chrome.storage
        console.log("Checking if auto key is enabled");
        const storageData = await new Promise<{autoKeyEnabled?: boolean}>(resolve => 
            chrome.storage.local.get('autoKeyEnabled', resolve)
        );
        const isAutoKeyEnabled = storageData.autoKeyEnabled === true;
        console.log("Auto key enabled:", isAutoKeyEnabled);
        
        if (!isAutoKeyEnabled) {
            console.warn('[DEBUG] Auto press is disabled');
            return;
        }
    
        // console.log(`[DEBUG] Preparing to press ${keyInfo.key} key in tab ${tabId}`);
        // TODO: тут остановился адаптируя логику нажатия из ветки new-write-method
        try {
            // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (keyInfo) => {
                    try {
                        const element = document.activeElement;
                        if (element) {
                            // Создаем события клавиатуры
                            const keydownEvent = new KeyboardEvent('keydown', {
                                key: keyInfo.key,
                                code: keyInfo.eventCode,
                                keyCode: keyInfo.keyCode,
                                which: keyInfo.keyCode,
                                bubbles: true,
                                cancelable: true
                            });
                            
                            const keypressEvent = new KeyboardEvent('keypress', {
                                key: keyInfo.key,
                                code: keyInfo.eventCode,
                                keyCode: keyInfo.keyCode,
                                which: keyInfo.keyCode,
                                bubbles: true,
                                cancelable: true
                            });
                            
                            const keyupEvent = new KeyboardEvent('keyup', {
                                key: keyInfo.key,
                                code: keyInfo.eventCode,
                                keyCode: keyInfo.keyCode,
                                which: keyInfo.keyCode,
                                bubbles: true,
                                cancelable: true
                            });

                            // Отправляем события
                            element.dispatchEvent(keydownEvent);
                            element.dispatchEvent(keypressEvent);
                            
                            // Вставляем текст
                            if (document.execCommand) {
                                document.execCommand('insertText', false, keyInfo.key);
                            } else {
                                // Fallback для случаев, когда execCommand не поддерживается
                                const start = (element as any).selectionStart || 0;
                                const end = (element as any).selectionEnd || 0;
                                const text = (element as any).value || '';
                                (element as any).value = text.substring(0, start) + keyInfo.key + text.substring(end);
                                (element as any).selectionStart = (element as any).selectionEnd = start + 1;
                            }
                            
                            element.dispatchEvent(keyupEvent);
                            
                            // Создаем и отправляем событие input
                            const inputEvent = new Event('input', {
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(inputEvent);
                        }
                        return true;
                    } catch (e) {
                        console.error('Error in executeScript:', e);
                        return false;
                    }
                },
                args: [keyInfo]
            });
    
            console.log(`[DEBUG] Key press result for ${keyInfo.key}:`);
        } catch (error) {
            console.error(`[DEBUG] Error pressing key ${keyInfo.key}:`, error);
        }
    }
    static async pressKeySequence(tabId: number) {
        
        console.debug('[DEBUG] Starting key sequence for tab', tabId);
        for (const keyInfo of this.KEYS.map(this.getKeyInfo)) {
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
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                console.debug('[CONTENT] Searching for second button');
                const buttonXPath = '/html/body/div[1]/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div/div[3]/div[2]/div[1]/div/div/div/div[2]/div[2]/div/div/div/button[2]';
                const result = document.evaluate(buttonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const button = result.singleNodeValue as HTMLButtonElement;
                
                if (button) {
                    console.debug('[CONTENT] Found second button, clicking');
                    button.click();
                    return true;
                } else {
                    console.debug('[CONTENT] Second button not found');
                    return false;
                }
            }
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
        // Проверяем, включен ли автоввод в chrome.storage
        console.log("Checking if auto key is enabled");
        const storageData = await new Promise<{autoKeyEnabled?: boolean}>(resolve => 
            chrome.storage.local.get('autoKeyEnabled', resolve)
        );
        const isAutoKeyEnabled = storageData.autoKeyEnabled === true;
        console.log("Auto key enabled:", isAutoKeyEnabled);
        
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
