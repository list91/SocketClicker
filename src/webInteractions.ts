import { browser } from 'webextension-polyfill-ts';

/**
 * Набор утилит для взаимодействия с веб-элементами
 */
export class WebInteractions {
    /**
     * Клик по элементу, найденному по XPath с расширенной диагностикой
     * @param xpath XPath селектор элемента
     * @returns Результат клика с диагностической информацией
     */
    static async clickByXPath(xpath: string) {
        console.log(`Clicking element by XPath "${xpath}"`);
        
        try {
            // Получаем активную вкладку
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];

            if (!activeTab || !activeTab.id) {
                throw new Error('No active tab found');
            }

            const result = await browser.tabs.executeScript(activeTab.id, {
                code: `
                    (function() {
                        console.log('Executing XPath click script');
                        try {
                            console.log('Current document URL:', document.location.href);
                            console.log('Document ready state:', document.readyState);
                            
                            const xpathResult = document.evaluate(
                                "${xpath}", 
                                document, 
                                null, 
                                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                                null
                            );

                            const element = xpathResult.singleNodeValue;

                            if (!element) {
                                console.error('No element found by XPath');
                                return { success: false, error: 'No element found' };
                            }

                            // Симуляция клика с событиями
                            const mouseEvent = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(mouseEvent);

                            return { 
                                success: true, 
                                message: 'Element clicked successfully' 
                            };
                        } catch (error) {
                            console.error('XPath click error:', error);
                            return { 
                                success: false, 
                                error: error.message 
                            };
                        }
                    })();
                `
            });

            return result[0];
        } catch (error: unknown) {
            console.error('Error in clickByXPath:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
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
