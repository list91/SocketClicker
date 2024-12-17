// Функция для получения последних команд от Proxy Pilot
async function fetchLatestCommands() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get_latest_commands'); // Эндпоинт для получения команд
        if (!response.ok) {
            throw new Error('Ошибка при получении команд');
        }
        const data = await response.json();
        console.log('Полученные команды:', data); // Логируем полученные данные
        return data.new_commands || []; // Извлекаем массив действий
    } catch (error) {
        console.error('Ошибка при запросе последних команд:', error);
        return [];
    }
}

async function fetchAddToHistoryCommands(ids: string[]) {
    try {
        const response = await fetch('http://127.0.0.1:5000/move_to_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        });
        if (!response.ok) {
            throw new Error('Ошибка при получении команд');
        }
        const data = await response.json();
        console.log('Полученные команды:', data); // Логируем полученные данные
        return "success";
    } catch (error) {
        console.error('Ошибка при запросе последних команд:', error);
        return "failure";
    }
}

setInterval(async () => {
  // const e = await fetchAddToHistoryCommands(["8a47c9cc-36e9-4e05-b449-ff28a3e51bc6"]);
  const commands = await fetchLatestCommands();
  if (commands.length === 0) {
    return;
  }
  console.log(commands)
  for (const command of commands) {
    for (const action of command.actions) {
      try {
        // eval(action.func);
        let activeTabId: number | undefined;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length > 0) {
                activeTabId = tabs[0].id;
            }
            if (activeTabId) {
                chrome.tabs.executeScript(activeTabId, {
                    code: action.func
                });
            }
        });
      } catch (e) {
        console.log("error", e);
      }
    }
    await fetchAddToHistoryCommands([command.id]);
  }
  
}, 3000);