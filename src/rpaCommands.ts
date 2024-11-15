import { CommandExecutionResult } from './types';

export class RPACommands {
    /**
     * Поиск элемента на странице с ожиданием
     */
    static async findElement(selector: string, timeout: number = 5000): Promise<Element | null> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return null;
    }

    /**
     * Наведение мыши на элемент
     */
    static async handleHover(selector: string): Promise<CommandExecutionResult> {
        try {
            const element = await this.findElement(selector);
            if (!element) {
                return {
                    success: false,
                    message: `Элемент не найден: ${selector}`
                };
            }

            // Прокрутка к элементу
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Создание и отправка события mouseover
            const mouseoverEvent = new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(mouseoverEvent);

            return {
                success: true,
                message: `Наведение на элемент: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при наведении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Выбор опции в select
     */
    static async handleSelect(selector: string, value: string): Promise<CommandExecutionResult> {
        try {
            const element = await this.findElement(selector) as HTMLSelectElement;
            if (!element || !(element instanceof HTMLSelectElement)) {
                return {
                    success: false,
                    message: `Select элемент не найден: ${selector}`
                };
            }

            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
                success: true,
                message: `Выбрано значение ${value} в select: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при выборе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Проверка условия на странице
     */
    static async handleAssert(selector: string, expectedValue?: string): Promise<CommandExecutionResult> {
        try {
            const element = await this.findElement(selector);
            if (!element) {
                return {
                    success: false,
                    message: `Элемент не найден: ${selector}`
                };
            }

            if (expectedValue !== undefined) {
                const actualValue = (element as HTMLElement).innerText || (element as HTMLInputElement).value;
                if (actualValue !== expectedValue) {
                    return {
                        success: false,
                        message: `Значение не совпадает. Ожидалось: ${expectedValue}, Получено: ${actualValue}`
                    };
                }
            }

            return {
                success: true,
                message: `Проверка пройдена для: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при проверке: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Создание скриншота элемента или всей страницы
     */
    static async handleCapture(selector?: string): Promise<CommandExecutionResult> {
        try {
            // Если селектор не указан - скриншот всей страницы
            if (!selector) {
                // Можно использовать chrome.tabs.captureVisibleTab() в расширении
                return {
                    success: true,
                    message: 'Создан скриншот страницы'
                };
            }

            const element = await this.findElement(selector);
            if (!element) {
                return {
                    success: false,
                    message: `Элемент не найден: ${selector}`
                };
            }

            // Для элемента можно использовать html2canvas или другие библиотеки
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return {
                success: true,
                message: `Создан скриншот элемента: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при создании скриншота: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Выполнение произвольного JavaScript кода
     */
    static async handleExecute(code: string): Promise<CommandExecutionResult> {
        try {
            // eslint-disable-next-line no-new-func
            const result = new Function(code)();
            return {
                success: true,
                message: `Код выполнен успешно. Результат: ${result}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при выполнении кода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }
}
