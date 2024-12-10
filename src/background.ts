// Функция для получения текущей вкладки
async function getCurrentTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
      throw new Error('Нет активных вкладок');
  }
  return tabs[0].id!;
}

// Функция для выполнения действий
async function executeActions(actions: any[]) {
    for (const action of actions) {
        try {
            if (action.func) {
                console.log(`Выполнение кода: ${action.func}`); // Выводим код перед выполнением
                const result = await chrome.scripting.executeScript({
                    target: { tabId: await getCurrentTabId() },
                    func: (message) => alert(message), // Выполнение alert в контексте страницы
                    args: [action.func] // Передаем сообщение как аргумент
                });
                console.log(`Результат выполнения действия ${action.name}:`, result);
            } else {
                console.log(`Не указана функция для действия ${action.name}`);
            }
        } catch (error) {
            console.error(`Ошибка при выполнении действия ${action.name}:`, error);
        }
    }
}

// Пример использования функции executeActions
const actions = [
    {
        name: "go ...",
        func: "Действие go выполнено"
    },
    {
        name: "click from ...",
        func: "Действие click выполнено"
    },
    {
        name: "input in ...",
        func: "Действие input выполнено"
    }
];

// Функция для периодического выполнения действий
async function periodicExecution() {
    while (true) {
        await executeActions(actions);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Ждем 3 секунды
    }
}

// Запускаем периодическое выполнение действий
periodicExecution();