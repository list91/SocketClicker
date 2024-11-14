interface Command {
    id: string;           // уникальный идентификатор команды
    type: CommandType;    // тип команды
    target: string;       // цель (например, URL или селектор)
    params?: any;         // дополнительные параметры
    status: 'pending' | 'processing' | 'completed' | 'failed';  // статус выполнения
    timestamp: number;    // время создания/обновления
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

export async function checkQueueStatus(): Promise<void> {
    try {
        const response = await fetch('http://localhost:8000/queue-status');
        const data: QueueResponse = await response.json();
        console.log('Queue commands:', data.commands);
        
        // Здесь можно добавить обработку команд
        data.commands.forEach(command => {
            console.log(`Command ${command.id}: ${command.type} on ${command.target}`);
        });
    } catch (error) {
        console.error('Error fetching queue status:', error);
    }
}
