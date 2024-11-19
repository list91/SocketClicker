import { XPATH_SELECTORS } from '../constants/xpathSelectors';
import { TIMEOUTS } from '../constants/timeouts';
import { waitForElement, waitForElementToBeInteractive, WaitConfig } from '../utils/waitForElement';

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
        try {
            const xpath = args[0];
            if (!xpath) {
                return {
                    success: false,
                    message: 'XPath не указан'
                };
            }

            const element = await waitForElement(xpath, TIMEOUTS.CLICK);
            await waitForElementToBeInteractive(element, TIMEOUTS.CLICK);
            
            (element as HTMLElement).click();
            
            return {
                success: true,
                message: 'Клик выполнен успешно'
            };
        } catch (error: unknown) {
            return {
                success: false,
                message: `Ошибка при выполнении клика: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
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
        try {
            const [xpath, text] = args;
            if (!xpath || !text) {
                return {
                    success: false,
                    message: 'XPath или текст не указаны'
                };
            }

            const element = await waitForElement(xpath, TIMEOUTS.INPUT);
            await waitForElementToBeInteractive(element, TIMEOUTS.INPUT);
            
            (element as HTMLInputElement).value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
                success: true,
                message: 'Текст введен успешно'
            };
        } catch (error: unknown) {
            return {
                success: false,
                message: `Ошибка при вводе текста: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
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
        try {
            console.log('[Publication] Starting publication process...');
            const text = params?.content;
            if (!text) {
                console.error('[Publication] No text provided for publication');
                return {
                    success: false,
                    message: 'Не указан текст для публикации'
                };
            }

            console.log('[Publication] Getting active tab...');
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            if (!tab?.id) {
                console.error('[Publication] No active tab found');
                return {
                    success: false,
                    message: 'Не найдена активная вкладка'
                };
            }

            console.log('[Publication] Navigating to publication page...');
            await chrome.tabs.update(tab.id, { url: XPATH_SELECTORS.PUBLICATION.START_PAGE });
            
            console.log('[Publication] Waiting for page load (12000ms)...');
            await new Promise(resolve => setTimeout(resolve, 12000));

            console.log('[Publication] Starting content script execution...');
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async (text: string, selectors: typeof XPATH_SELECTORS.PUBLICATION, timeouts: typeof TIMEOUTS.PUBLICATION): Promise<CommandExecutionResult> => {
                    try {
                        const logStep = (step: string, startTime: number) => {
                            const elapsed = Date.now() - startTime;
                            console.log(`[Publication] ${step} (${elapsed}ms)`);
                        };

                        // Функция ожидания элемента с логированием
                        const waitForElement = async (xpath: string, config?: WaitConfig): Promise<Element> => {
                            const startTime = Date.now();
                            const timeout = config?.timeout || 10000;
                            const interval = config?.interval || 500;
                            console.log(`[Publication] Waiting for element: ${xpath} (timeout: ${timeout}ms, interval: ${interval}ms)`);

                            while (Date.now() - startTime < timeout) {
                                const element = document.evaluate(
                                    xpath,
                                    document,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                ).singleNodeValue;

                                if (element) {
                                    logStep(`Element found: ${xpath}`, startTime);
                                    return element as Element;
                                }

                                await new Promise(resolve => setTimeout(resolve, interval));
                                console.log(`[Publication] Still waiting for element: ${xpath} (${Date.now() - startTime}ms elapsed)`);
                            }

                            throw new Error(`Элемент не найден: ${xpath}`);
                        };

                        // Функция проверки интерактивности с логированием
                        const waitForElementToBeInteractive = async (element: Element, config?: WaitConfig): Promise<boolean> => {
                            const startTime = Date.now();
                            const timeout = config?.timeout || 10000;
                            const interval = config?.interval || 500;
                            console.log('[Publication] Checking element interactivity...');

                            while (Date.now() - startTime < timeout) {
                                const rect = element.getBoundingClientRect();
                                const isVisible = !!(rect.top || rect.bottom || rect.width || rect.height);
                                
                                if (isVisible && 
                                    !element.hasAttribute('disabled') && 
                                    window.getComputedStyle(element).display !== 'none' &&
                                    window.getComputedStyle(element).visibility !== 'hidden') {
                                    logStep('Element is interactive', startTime);
                                    return true;
                                }

                                await new Promise(resolve => setTimeout(resolve, interval));
                                console.log(`[Publication] Waiting for element to be interactive (${Date.now() - startTime}ms elapsed)`);
                            }

                            throw new Error('Элемент не доступен для взаимодействия');
                        };

                        console.log('[Publication] Looking for publish button...');
                        const publishButton = await waitForElement(
                            selectors.PUBLISH_BUTTON,
                            timeouts.PUBLISH_BUTTON
                        );
                        await waitForElementToBeInteractive(publishButton, timeouts.PUBLISH_BUTTON);
                        console.log('[Publication] Clicking publish button...');
                        (publishButton as HTMLElement).click();

                        console.log('[Publication] Looking for input form...');
                        const inputForm = await waitForElement(
                            selectors.TEXT_INPUT,
                            timeouts.TEXT_INPUT
                        );
                        await waitForElementToBeInteractive(inputForm, timeouts.TEXT_INPUT);
                        
                        console.log('[Publication] Setting text input value...');
                        (inputForm as HTMLInputElement).value = text;
                        inputForm.dispatchEvent(new Event('input', { bubbles: true }));
                        inputForm.dispatchEvent(new Event('change', { bubbles: true }));

                        console.log('[Publication] Looking for submit button...');
                        const submitButton = await waitForElement(
                            selectors.SUBMIT_BUTTON,
                            timeouts.SUBMIT_BUTTON
                        );
                        await waitForElementToBeInteractive(submitButton, timeouts.SUBMIT_BUTTON);
                        console.log('[Publication] Clicking submit button...');
                        (submitButton as HTMLElement).click();

                        console.log('[Publication] Waiting for confirmation...');
                        await waitForElement(
                            selectors.SUBMIT_BUTTON,
                            timeouts.SUBMIT_BUTTON
                        );

                        console.log('[Publication] Publication completed successfully');
                        return {
                            success: true,
                            message: 'Публикация успешно создана'
                        };
                    } catch (error: unknown) {
                        const errorMessage = `Ошибка при создании публикации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
                        console.error(`[Publication] ${errorMessage}`);
                        return {
                            success: false,
                            message: errorMessage
                        };
                    }
                },
                args: [text, XPATH_SELECTORS.PUBLICATION, TIMEOUTS.PUBLICATION]
            });

            if (!result[0].result) {
                console.error('[Publication] Script execution failed');
                return {
                    success: false,
                    message: 'Не удалось выполнить скрипт публикации'
                };
            }

            return result[0].result;
        } catch (error: unknown) {
            const errorMessage = `Ошибка при создании публикации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
            console.error(`[Publication] ${errorMessage}`);
            return {
                success: false,
                message: errorMessage
            };
        }
    }
}
