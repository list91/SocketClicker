export enum CommandType {
    PING = 'ping',
    ECHO = 'echo',
    CLICK = 'click',
    INPUT = 'input',
    SCROLL = 'scroll',
    WAIT = 'wait'
}

export interface CommandExecutionResult {
    success: boolean;
    message?: string;
}

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
}
