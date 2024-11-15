export enum CommandType {
    PING = 'ping',
    ECHO = 'echo',
    CLICK = 'click',
    INPUT = 'input',
    SCROLL = 'scroll',
    WAIT = 'wait',
    TEST = 'test',
    
    // Новые RPA-подобные команды
    FIND_ELEMENT = 'find',
    HOVER = 'hover',
    SELECT = 'select',
    ASSERT = 'assert',
    CAPTURE = 'capture',
    EXECUTE = 'execute',
    
    // Команды для работы с вкладками
    OPEN_TAB = 'openTab',
    SWITCH_TAB = 'switchTab',
    CLOSE_TAB = 'closeTab',
    UPDATE_TAB = 'updateTab'
}

export interface CommandExecutionResult {
    success: boolean;
    message?: string;
}

import { RPACommands } from './rpaCommands';
import { getCurrentTab, activateTab, createTab, getTab, updateUrlForTab } from './tabUtils';

export class CommandExecutor {
    private static extractCommandParts(command: string): { type: string, args: string[] } {
        const parts = command.trim().split(/\s+/);
        const type = parts[0].toLowerCase();
        const args = parts.slice(1);
        return { type, args };
    }

    public static async executeCommand(command: string): Promise<CommandExecutionResult> {
        const { type, args } = this.extractCommandParts(command);

        switch (type) {
            case CommandType.PING:
                return this.handlePing();
            
            case CommandType.ECHO:
                return this.handleEcho(args);
            
            case CommandType.CLICK:
                return this.handleClick(args);
            
            case CommandType.INPUT:
                return this.handleInput(args);
            
            case CommandType.SCROLL:
                return this.handleScroll(args);
            
            case CommandType.WAIT:
                return this.handleWait(args);
            
            case CommandType.TEST:
                return this.handleTest(args);
            
            case CommandType.FIND_ELEMENT:
                return RPACommands.findElement(args[0])
                    .then(element => ({
                        success: !!element,
                        message: element ? `Элемент найден: ${args[0]}` : `Элемент не найден: ${args[0]}`
                    }));
            
            case CommandType.HOVER:
                return RPACommands.handleHover(args[0]);
            
            case CommandType.SELECT:
                return RPACommands.handleSelect(args[0], args[1]);
            
            case CommandType.ASSERT:
                return RPACommands.handleAssert(args[0], args[1]);
            
            case CommandType.CAPTURE:
                return RPACommands.handleCapture(args[0]);
            
            case CommandType.EXECUTE:
                return RPACommands.handleExecute(args.join(' '));
            
            case CommandType.OPEN_TAB:
                return this.handleOpenTab(args);
            
            case CommandType.SWITCH_TAB:
                return this.handleSwitchTab(args);
            
            case CommandType.CLOSE_TAB:
                return this.handleCloseTab(args);
            
            case CommandType.UPDATE_TAB:
                return this.handleUpdateTab(args);
            
            default:
                return {
                    success: false,
                    message: `Неизвестная команда: ${type}`
                };
        }
    }

    private static handlePing(): CommandExecutionResult {
        console.log('Ping received');
        return {
            success: true,
            message: 'Pong'
        };
    }

    private static handleEcho(args: string[]): CommandExecutionResult {
        const message = args.join(' ');
        console.log('Echo:', message);
        return {
            success: true,
            message: message
        };
    }

    private static async handleClick(args: string[]): Promise<CommandExecutionResult> {
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

    private static async handleInput(args: string[]): Promise<CommandExecutionResult> {
        if (args.length < 2) {
            return {
                success: false,
                message: 'Не указан селектор или текст для ввода'
            };
        }

        try {
            const selector = args[0];
            const text = args.slice(1).join(' ');
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

    private static async handleScroll(args: string[]): Promise<CommandExecutionResult> {
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

    private static async handleWait(args: string[]): Promise<CommandExecutionResult> {
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

    private static async handleTest(args: string[]): Promise<CommandExecutionResult> {
        try {
            const url = args[0] || 'https://example.com'; // Если URL не указан, используем example.com
            const tab = await createTab(url);
            
            return {
                success: true,
                message: `Тестовая вкладка создана с URL: ${url}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при создании тестовой вкладки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    private static async handleOpenTab(args: string[]): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указан URL для новой вкладки'
            };
        }

        try {
            const url = args[0];
            const tab = await createTab(url);
            
            return {
                success: true,
                message: `Открыта новая вкладка с URL: ${url}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при открытии вкладки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    private static async handleSwitchTab(args: string[]): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указан ID вкладки'
            };
        }

        try {
            const tabId = parseInt(args[0], 10);
            const focusWindow = args[1] === 'true';
            
            await activateTab(tabId, focusWindow);
            return {
                success: true,
                message: `Переключено на вкладку ${tabId}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при переключении вкладки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    private static async handleCloseTab(args: string[]): Promise<CommandExecutionResult> {
        if (args.length < 1) {
            return {
                success: false,
                message: 'Не указан ID вкладки'
            };
        }

        try {
            const tabId = parseInt(args[0], 10);
            await chrome.tabs.remove(tabId);
            
            return {
                success: true,
                message: `Закрыта вкладка ${tabId}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при закрытии вкладки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }

    private static async handleUpdateTab(args: string[]): Promise<CommandExecutionResult> {
        if (args.length < 2) {
            return {
                success: false,
                message: 'Не указан ID вкладки или новый URL'
            };
        }

        try {
            const tabId = parseInt(args[0], 10);
            const url = args[1];
            
            await updateUrlForTab(tabId, url);
            return {
                success: true,
                message: `Обновлен URL вкладки ${tabId}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ошибка при обновлении вкладки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
            };
        }
    }
}
