// Функция для получения текущей вкладки
async function getCurrentTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
      throw new Error('Нет активных вкладок');
  }
  return tabs[0].id!;
}

// Функция для получения последних команд от Proxy Pilot
async function fetchLatestCommands() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get_latest_commands'); // Эндпоинт для получения команд
        if (!response.ok) {
            throw new Error('Ошибка при получении команд');
        }
        const data = await response.json();
        console.log('Полученные команды:', data); // Логируем полученные данные
        return data.new_commands.flatMap(command => command.actions) || []; // Извлекаем массив действий
    } catch (error) {
        console.error('Ошибка при запросе последних команд:', error);
        return [];
    }
}

// Функция для выполнения действий
async function executeActions(actions: any[]) {
    for (const action of actions) {
        try {
            if (action.func && typeof action.func === 'string') {
                console.log(`Выполнение кода: ${action.func}`); // Выводим код перед выполнением
                const result = await chrome.scripting.executeScript({
                    target: { tabId: await getCurrentTabId() },
                    func: (message) => alert(message), // Выполнение alert в контексте страницы
                    args: [action.func] // Передаем сообщение как аргумент
                });
                console.log(`Результат выполнения действия ${action.name}:`, result);
            } else {
                console.error(`Не указана функция для действия ${action.name}`); // Логируем ошибку
            }
        } catch (error) {
            console.error(`Ошибка при выполнении действия ${action.name}:`, error);
        }
    }
}

// Функция для периодического выполнения действий
async function periodicExecution() {
    while (true) {
        const actions = await fetchLatestCommands(); // Получаем последние команды
        await executeActions(actions); // Выполняем действия
        await new Promise(resolve => setTimeout(resolve, 3000)); // Ждем 3 секунды
    }
}

// Запускаем периодическое выполнение действий
periodicExecution();