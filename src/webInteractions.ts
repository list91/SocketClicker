import { browser } from 'webextension-polyfill-ts';

/**
 * Набор утилит для взаимодействия с веб-элементами
 */
export class WebInteractions {
    /**
     * Клик по элементу, найденному по XPath с расширенной диагностикой
     * @param tabId ID вкладки
     * @param xpath XPath селектор элемента
     * @returns Результат клика с диагностической информацией
     */
    static async clickByXPath(tabId: number, xpath: string) {
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

    /**
     * Ввод текста в активное текстовое поле
     * @param tabId ID вкладки
     * @param text Текст для ввода
     * @returns Результат ввода текста
     */
    static async typeText(tabId: number, text: string) {
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

    /**
     * Прокрутка страницы к определенному элементу
     * @param tabId ID вкладки
     * @param xpath XPath селектор элемента
     * @returns Результат прокрутки
     */
    static async scrollToElement(tabId: number, xpath: string) {
        try {
            const result = await browser.tabs.executeScript(tabId, {
                code: `
                    (function() {
                        try {
                            const element = document.evaluate(
                                "${xpath}", 
                                document, 
                                null, 
                                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                                null
                            ).singleNodeValue;

                            if (!element) {
                                return { 
                                    success: false, 
                                    message: 'Element not found' 
                                };
                            }

                            element.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });

                            return { 
                                success: true, 
                                message: 'Scrolled to element successfully' 
                            };
                        } catch (error) {
                            return { 
                                success: false, 
                                message: error.toString() 
                            };
                        }
                    })();
                `,
                runAt: 'document_end'
            });

            return result[0] || { success: false, message: 'No result from script' };
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Получение текста с элемента
     * @param tabId ID вкладки
     * @param xpath XPath селектор элемента
     * @returns Текст элемента
     */
    static async getElementText(tabId: number, xpath: string) {
        try {
            const result = await browser.tabs.executeScript(tabId, {
                code: `
                    (function() {
                        try {
                            const element = document.evaluate(
                                "${xpath}", 
                                document, 
                                null, 
                                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                                null
                            ).singleNodeValue;

                            if (!element) {
                                return { 
                                    success: false, 
                                    message: 'Element not found' 
                                };
                            }

                            return { 
                                success: true, 
                                text: element.textContent || element.innerText 
                            };
                        } catch (error) {
                            return { 
                                success: false, 
                                message: error.toString() 
                            };
                        }
                    })();
                `,
                runAt: 'document_end'
            });

            return result[0] || { success: false, message: 'No result from script' };
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }
}
