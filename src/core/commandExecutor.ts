import { XPATH_SELECTORS } from '../constants/xpathSelectors';

/**
 * Типы команд
 */
export enum CommandType {
    PING = 'ping',
    ECHO = 'echo',
    CLICK = 'click',
    INPUT = 'input',
    SCROLL = 'scroll',
    WAIT = 'wait',
    PUBLICATION = 'publication'
}

/**
 * Результат выполнения команды
 */
export interface CommandExecutionResult {
    success: boolean;
    message?: string;
}

/**
 * Параметры команды
 */
interface CommandParams {
    content?: string;
    [key: string]: any;
}

/**
 * Класс для выполнения команд
 */
export class CommandExecutor {
    /**
     * Извлекает тип и аргументы команды из строки
     * @param command строка с командой
     * @returns объект с типом и аргументами команды
     */
    private static extractCommandParts(command: string): { type: string, args: string[] } {
        const parts = command.trim().split(/\s+/);
        const type = parts[0].toLowerCase();
        const args = parts.slice(1);
        return { type, args };
    }

    /**
     * Выполняет команду
     * @param command строка с командой
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    public static async executeCommand(command: string, params?: CommandParams): Promise<CommandExecutionResult> {
        const { type, args } = this.extractCommandParts(command);

        switch (type) {
            case CommandType.PING:
                return this.handlePing();
            
            case CommandType.ECHO:
                return this.handleEcho(args, params);
            
            case CommandType.CLICK:
                return this.handleClick(args, params);
            
            case CommandType.INPUT:
                return this.handleInput(args, params);
            
            case CommandType.SCROLL:
                return this.handleScroll(args, params);
            
            case CommandType.WAIT:
                return this.handleWait(args, params);

            case CommandType.PUBLICATION:
                return this.handlePublication(args, params);
            
            default:
                return {
                    success: false,
                    message: `Неизвестная команда: ${type}`
                };
        }
    }

    /**
     * Обрабатывает команду ping
     * @returns результат выполнения команды
     */
    private static handlePing(): CommandExecutionResult {
        console.log('Ping received');
        return {
            success: true,
            message: 'Pong'
        };
    }

    /**
     * Обрабатывает команду echo
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static handleEcho(args: string[], params?: CommandParams): CommandExecutionResult {
        const message = params?.content || args.join(' ');
        console.log('Echo:', message);
        return {
            success: true,
            message: message
        };
    }

    /**
     * Обрабатывает команду click
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static async handleClick(args: string[], params?: CommandParams): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указан селектор для клика'
            };
        }

        try {
            const selector = args[0];
            const element = document.querySelector(selector);
            
            if (!element) {
                return {
                    success: false,
                    message: `Элемент не найден: ${selector}`
                };
            }

            (element as HTMLElement).click();
            return {
                success: true,
                message: `Клик по элементу: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при клике: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Обрабатывает команду input
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static async handleInput(args: string[], params?: CommandParams): Promise<CommandExecutionResult> {
        if (args.length < 2) {
            return {
                success: false,
                message: 'Не указан селектор или текст для ввода'
            };
        }

        try {
            const selector = args[0];
            const text = params?.content || args.slice(1).join(' ');
            const element = document.querySelector(selector) as HTMLInputElement;
            
            if (!element) {
                return {
                    success: false,
                    message: `Элемент не найден: ${selector}`
                };
            }

            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
                success: true,
                message: `Введен текст в элемент: ${selector}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при вводе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Обрабатывает команду scroll
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static async handleScroll(args: string[], params?: CommandParams): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указано направление или количество прокрутки'
            };
        }

        try {
            const direction = args[0].toLowerCase();
            const amount = parseInt(args[1] || '100', 10);

            switch (direction) {
                case 'up':
                    window.scrollBy(0, -amount);
                    break;
                case 'down':
                    window.scrollBy(0, amount);
                    break;
                case 'top':
                    window.scrollTo(0, 0);
                    break;
                case 'bottom':
                    window.scrollTo(0, document.body.scrollHeight);
                    break;
                default:
                    return {
                        success: false,
                        message: `Неизвестное направление прокрутки: ${direction}`
                    };
            }

            return {
                success: true,
                message: `Прокрутка ${direction} на ${amount} пикселей`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при прокрутке: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Обрабатывает команду wait
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static async handleWait(args: string[], params?: CommandParams): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указано время ожидания'
            };
        }

        try {
            const duration = parseInt(args[0], 10);
            
            if (isNaN(duration)) {
                return {
                    success: false,
                    message: `Некорректное время ожидания: ${args[0]}`
                };
            }

            await new Promise(resolve => setTimeout(resolve, duration));

            return {
                success: true,
                message: `Ожидание ${duration} мс`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при ожидании: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    /**
     * Обрабатывает команду publication
     * @param args аргументы команды
     * @param params параметры команды
     * @returns результат выполнения команды
     */
    private static async handlePublication(args: string[], params?: CommandParams): Promise<CommandExecutionResult> {
        const text = params?.content;
        if (!text) {
            return {
                success: false,
                message: 'Не указан текст для публикации'
            };
        }

        try {
            // Get active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            if (!tab?.id) {
                return {
                    success: false,
                    message: 'Не найдена активная вкладка'
                };
            }

            // Navigate to the start page
            await chrome.tabs.update(tab.id, { url: XPATH_SELECTORS.PUBLICATION.START_PAGE });

            // Wait for page load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Execute content script for publication
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text: string, selectors: typeof XPATH_SELECTORS.PUBLICATION) => {
                    try {
                        // Click publish button
                        const publishButton = document.evaluate(
                            selectors.PUBLISH_BUTTON,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue as HTMLElement;

                        if (!publishButton) {
                            return { success: false, message: 'Кнопка публикации не найдена' } as CommandExecutionResult;
                        }
                        publishButton.click();

                        // Wait for form
                        return new Promise<CommandExecutionResult>(resolve => {
                            setTimeout(async () => {
                                try {
                                    // Input text
                                    const textInput = document.evaluate(
                                        selectors.TEXT_INPUT,
                                        document,
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null
                                    ).singleNodeValue as HTMLElement;

                                    if (!textInput) {
                                        resolve({ success: false, message: 'Поле ввода текста не найдено' });
                                        return;
                                    }
                                    textInput.textContent = text;

                                    // Click submit button
                                    const submitButton = document.evaluate(
                                        selectors.SUBMIT_BUTTON,
                                        document,
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null
                                    ).singleNodeValue as HTMLElement;

                                    if (!submitButton) {
                                        resolve({ success: false, message: 'Кнопка отправки не найдена' });
                                        return;
                                    }
                                    submitButton.click();

                                    resolve({ success: true, message: 'Публикация успешно выполнена' });
                                } catch (error) {
                                    resolve({
                                        success: false,
                                        message: `Ошибка при выполнении действий: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
                                    });
                                }
                            }, 1000);
                        });
                    } catch (error) {
                        return {
                            success: false,
                            message: `Ошибка при выполнении действий: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
                        } as CommandExecutionResult;
                    }
                },
                args: [text, XPATH_SELECTORS.PUBLICATION]
            });

            if (!results || results.length === 0 || !results[0].result) {
                return {
                    success: false,
                    message: 'Не удалось выполнить скрипт публикации'
                };
            }

            return results[0].result;
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при публикации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }
}
