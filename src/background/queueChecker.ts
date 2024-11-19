import { updateBadge, getState } from '../core/common';
import { CommandExecutor } from '../core/commandExecutor';

const SERVER_BASE_URL = 'http://localhost:5000';

interface Command {
    id: string;
    command: string;
    params?: {
        content?: string;
        [key: string]: any;
    };
    time_created: string;
}

// Множество для хранения ID команд в процессе выполнения
const processingCommands = new Set<string>();

export async function checkQueueStatus() {
    try {
        // Check if extension is enabled
        const state = await getState();
        if (!state.enabled) {
            await updateBadge();
            return;
        }

        const response = await fetch(`${SERVER_BASE_URL}/read_first?count=1`);
        
        if (!response.ok) {
            console.error(`Failed to fetch commands. Status: ${response.status}`);
            await updateBadge();
            return;
        }

        const commands: Command[] = await response.json();

        if (commands.length > 0) {
            const command = commands[0];

            // Проверяем, не выполняется ли уже эта команда
            if (processingCommands.has(command.id)) {
                console.log(`Command ${command.id} is already being processed, skipping...`);
                await updateBadge();
                return;
            }

            console.log('Received command:', command);

            // Проверяем состояние расширения перед выполнением команды
            const currentState = await getState();
            if (!currentState.enabled) {
                console.log('Extension is disabled, skipping command execution');
                await updateBadge();
                return;
            }

            try {
                // Добавляем команду в множество обрабатываемых
                processingCommands.add(command.id);

                // Обработка команды с использованием CommandExecutor
                const result = await CommandExecutor.executeCommand(command.command, command.params);
                
                // Логирование результата выполнения команды
                console.log(`Команда "${command.command}":`, result);

                // Отправляем команду в историю на том же сервере
                const moveResponse = await fetch(`${SERVER_BASE_URL}/move_to_history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        command: command.command,
                        id: command.id,
                        params: command.params,
                        time_created: command.time_created,
                        result: result
                    })
                });

                if (!moveResponse.ok) {
                    const errorText = await moveResponse.text();
                    console.error(`Failed to move command to history. Status: ${moveResponse.status}, Error: ${errorText}`);
                }
            } catch (error) {
                console.error('Error processing command:', error);
            } finally {
                // Удаляем команду из множества обрабатываемых, независимо от результата
                processingCommands.delete(command.id);
            }
        } else {
            console.log('No commands in queue');
        }
        
        await updateBadge();
    } catch (error) {
        if (error instanceof TypeError) {
            console.error('Network error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        await updateBadge();
    }
}
