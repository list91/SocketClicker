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

// Функция для клика по элементу, найденному по XPath
async function clickByXPath(tabId: number, xpath: string) {
    console.log(`Clicking element by XPath "${xpath}" in tab ${tabId}`);
    
    try {
        const result = await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    console.log('Executing XPath click script');
                    try {
                        // Максимально подробная отладка
                        console.log('Current document URL:', document.location.href);
                        console.log('Document ready state:', document.readyState);
                        
                        // Проверка полного DOM
                        const fullDomStructure = document.body ? 
                            Array.from(document.body.children).map(el => el.tagName) : 
                            'body not available';
                        console.log('DOM top-level structure:', fullDomStructure);

                        // Расширенная отладка XPath
                        const xpathResult = document.evaluate(
                            "${xpath}", 
                            document, 
                            null, 
                            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                            null
                        );

                        console.log('XPath total matches:', xpathResult.snapshotLength);

                        // Если нет совпадений
                        if (xpathResult.snapshotLength === 0) {
                            console.error('No elements found by XPath');
                            
                            // Попробуем альтернативные селекторы
                            const divs = document.getElementsByTagName('div');
                            console.log('Total div count:', divs.length);
                            
                            // Выводим первые 10 div для отладки
                            const firstTenDivs = Array.from(divs).slice(0, 10).map((div, index) => ({
                                index,
                                tagName: div.tagName,
                                className: div.className,
                                id: div.id
                            }));
                            console.log('First 10 divs:', JSON.stringify(firstTenDivs));

                            return { 
                                success: false, 
                                message: 'No elements found by XPath',
                                debugInfo: {
                                    title: document.title,
                                    url: document.location.href,
                                    totalDivs: divs.length,
                                    firstTenDivs: firstTenDivs
                                }
                            };
                        }

                        // Берем первый найденный элемент
                        const element = xpathResult.snapshotItem(0);

                        if (!element) {
                            console.error('First XPath element is null');
                            return { 
                                success: false, 
                                message: 'First XPath element is null' 
                            };
                        }

                        // Расширенная информация об элементе
                        console.log('Element details:', {
                            tagName: element.tagName,
                            className: (element as HTMLElement).className,
                            id: (element as HTMLElement).id,
                            isVisible: window.getComputedStyle(element as Element).display !== 'none',
                            isClickable: (element as HTMLElement).onclick !== null,
                            parentTagName: (element.parentNode as Element)?.tagName,
                            parentClassName: ((element.parentNode as HTMLElement)?.className || '')
                        });

                        // Прокручиваем к элементу
                        (element as Element).scrollIntoView({ 
                            behavior: 'auto', 
                            block: 'center' 
                        });

                        // Симулируем клик через диспетчеризацию событий
                        const mouseoverEvent = new MouseEvent('mouseover', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });

                        const mousedownEvent = new MouseEvent('mousedown', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            button: 0
                        });

                        const mouseupEvent = new MouseEvent('mouseup', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            button: 0
                        });

                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            button: 0
                        });

                        // Последовательность событий
                        (element as Element).dispatchEvent(mouseoverEvent);
                        (element as Element).dispatchEvent(mousedownEvent);
                        (element as Element).dispatchEvent(mouseupEvent);
                        (element as Element).dispatchEvent(clickEvent);

                        // Пробуем вызвать click() напрямую
                        if (typeof (element as HTMLElement).click === 'function') {
                            (element as HTMLElement).click();
                        }

                        console.log('Click performed successfully');
                        return { 
                            success: true, 
                            message: 'Element clicked successfully',
                            elementInfo: {
                                tagName: element.tagName,
                                className: (element as HTMLElement).className,
                                id: (element as HTMLElement).id,
                                parentTagName: (element.parentNode as Element)?.tagName,
                                parentClassName: ((element.parentNode as HTMLElement)?.className || '')
                            }
                        };
                    } catch (error) {
                        console.error('Error in XPath click script:', error);
                        return { 
                            success: false, 
                            message: error.toString(),
                            stack: error instanceof Error ? error.stack : undefined
                        };
                    }
                })();
            `,
            runAt: 'document_end'
        });

        console.log('ExecuteScript result:', JSON.stringify(result));
        return result[0] || { success: false, message: 'No result from script' };
    } catch (error) {
        console.error('Error executing XPath click:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

// Функция для ввода текста в активную вкладку
async function typeText(tabId: number, text: string) {
    console.log(`Typing text "${text}" in tab ${tabId}`);
    
    try {
        const result = await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    console.log('Executing text typing script');
                    try {
                        // Получаем активный элемент ввода
                        const activeInput = document.activeElement;
                        console.log('Active element:', activeInput);
                        
                        if (!activeInput) {
                            console.error('No active input element');
                            return { 
                                success: false, 
                                message: 'No active input element' 
                            };
                        }

                        // Проверяем, что это поле ввода
                        const isInputElement = 
                            activeInput instanceof HTMLInputElement || 
                            activeInput instanceof HTMLTextAreaElement ||
                            activeInput.isContentEditable ||
                            activeInput.tagName.toLowerCase() === 'div';

                        console.log('Is valid input element:', isInputElement);

                        if (!isInputElement) {
                            console.error('Not a valid input element');
                            return { 
                                success: false, 
                                message: 'Not a valid input element' 
                            };
                        }

                        // Очищаем существующий текст
                        if (activeInput instanceof HTMLInputElement || 
                            activeInput instanceof HTMLTextAreaElement) {
                            activeInput.value = '';
                        } else {
                            activeInput.textContent = '';
                        }

                        // Вводим текст посимвольно
                        for (const char of "${text}") {
                            const keydownEvent = new KeyboardEvent('keydown', {
                                key: char,
                                bubbles: true,
                                cancelable: true
                            });
                            
                            const inputEvent = new InputEvent('input', {
                                bubbles: true,
                                cancelable: true
                            });

                            const keyupEvent = new KeyboardEvent('keyup', {
                                key: char,
                                bubbles: true,
                                cancelable: true
                            });

                            // Диспетчеризация событий
                            activeInput.dispatchEvent(keydownEvent);
                            
                            if (activeInput instanceof HTMLInputElement || 
                                activeInput instanceof HTMLTextAreaElement) {
                                activeInput.value += char;
                            } else {
                                activeInput.textContent += char;
                            }
                            
                            activeInput.dispatchEvent(inputEvent);
                            activeInput.dispatchEvent(keyupEvent);
                        }

                        // Триггерим событие change
                        const changeEvent = new Event('change', { bubbles: true });
                        activeInput.dispatchEvent(changeEvent);

                        console.log('Text typed successfully');
                        return { 
                            success: true, 
                            message: 'Text typed successfully' 
                        };
                    } catch (error) {
                        console.error('Error in text typing script:', error);
                        return { 
                            success: false, 
                            message: error.toString() 
                        };
                    }
                })();
            `,
            runAt: 'document_end'
        });

        console.log('ExecuteScript result:', JSON.stringify(result));
        return result[0] || { success: false, message: 'No result from script' };
    } catch (error) {
        console.error('Error executing text typing:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        };
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
        // stopInterval();
        // Запускаем новый интервал для обновленной вкладки
        // await startInterval(tabId);
    }
});

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener(async (message, sender) => {
    console.log('Message received in background:', JSON.stringify(message));
    
    try {
        // Получаем активную вкладку
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab || !activeTab.id) {
            console.error('No active tab found');
            return { success: false, message: 'No active tab' };
        }

        console.log(`Active tab ID: ${activeTab.id}`);

        // Обработка различных действий
        switch (message.action) {
            case 'toggleAutoQ':
                if (message.value) {
                    await startInterval(activeTab.id);
                } else {
                    stopInterval();
                }
                return { success: true };

            case 'typeText':
                if (message.text) {
                    console.log(`Attempting to type text: ${message.text}`);
                    return await typeText(activeTab.id, message.text);
                }
                return { success: false, message: 'No text provided' };

            case 'clickByXPath':
                if (message.xpath) {
                    console.log(`Attempting to click XPath: ${message.xpath}`);
                    return await clickByXPath(activeTab.id, message.xpath);
                }
                return { success: false, message: 'No XPath provided' };
            
            default:
                console.log('Unhandled action:', message.action);
                return { success: false, message: 'Unhandled action' };
        }
    } catch (error) {
        console.error('Error in background message listener:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
});
