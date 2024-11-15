interface Command {
    id: string;
    command: string;
    time_created: string;
}

enum CommandType {
    CLICK = 'click',
    INPUT = 'input',
    SCROLL = 'scroll',
    WAIT = 'wait'
}

interface QueueResponse {
    status: string;
    commands: Command[];
}

const SERVER_BASE_URL = 'http://localhost:5000';

export async function checkQueueStatus(): Promise<void> {
    try {
        // Получаем первую команду
        const readResponse = await fetch(`${SERVER_BASE_URL}/read_first?count=1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!readResponse.ok) {
            console.error(`Server responded with status: ${readResponse.status}`);
            return;
        }

        const commands: Command[] = await readResponse.json();

        if (commands.length > 0) {
            const command = commands[0];
            console.log('Received command:', command);

            // Отправляем команду в историю на том же сервере
            const moveResponse = await fetch(`${SERVER_BASE_URL}/move_to_history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ ids: [command.id] })
            });

            if (!moveResponse.ok) {
                console.error(`Failed to move command to history. Status: ${moveResponse.status}`);
                return;
            }

            // Выводим содержимое команды в консоль
            console.log('Command content:', command.command);

            // Простая обработка команд
            switch (command.command.toLowerCase()) {
                case 'ping':
                    console.log('Ping received');
                    break;
                case command.command.match(/^echo\s/) && command.command:
                    console.log('Echo command:', command.command.replace('echo ', ''));
                    break;
                default:
                    console.warn('Неизвестная команда:', command.command);
            }
        } else {
            console.log('No commands in queue');
        }
    } catch (error) {
        if (error instanceof TypeError) {
            console.error('Network error: Сервер недоступен. Проверьте, запущен ли сервер на localhost:5000');
        } else if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('Timeout: Сервер не отвечает в течение 5 секунд');
        } else {
            console.error('Unexpected error processing queue:', error);
        }
    }
}
