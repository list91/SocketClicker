import { setBadgeText } from './common';
import { CommandExecutor } from './commandExecutor';

const SERVER_BASE_URL = 'http://localhost:5000';

interface Command {
    id: string;
    command: string;
    time_created: string;
}

export async function checkQueueStatus() {
    try {
        const response = await fetch(`${SERVER_BASE_URL}/read_first?count=1`);
        
        if (!response.ok) {
            console.error(`Failed to fetch commands. Status: ${response.status}`);
            setBadgeText(false);
            return;
        }

        const commands: Command[] = await response.json();

        if (commands.length > 0) {
            const command = commands[0];
            console.log('Received command:', command);

            // Обработка команды с использованием CommandExecutor
            const result = await CommandExecutor.executeCommand(command.command);
            
            // Логирование результата выполнения команды
            console.log(`Команда "${command.command}":`, result);
            
            // Обновление бейджа с результатом
            setBadgeText(result.success);

            // Отправляем команду в историю на том же сервере
            const moveResponse = await fetch(`${SERVER_BASE_URL}/move_to_history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([command])
            });

            if (!moveResponse.ok) {
                console.error(`Failed to move command to history. Status: ${moveResponse.status}`);
                setBadgeText(false);
                return;
            }
        } else {
            console.log('No commands in queue');
            setBadgeText(true);
        }
    } catch (error) {
        if (error instanceof TypeError) {
            console.error('Network error:', error.message);
            setBadgeText(false);
        } else {
            console.error('Unexpected error:', error);
            setBadgeText(false);
        }
    }
}
