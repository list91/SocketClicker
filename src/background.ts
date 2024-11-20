// Simplified background script to fetch commands every 3 seconds
console.log('Background script started');

// Типы для JSON команд
interface CommandAction {
  on_start: number;
  action: 'go' | 'input' | 'click';
  value: string;
  element_xpath?: string;
}

interface JsonCommand {
  id: string;
  command: string;
  params: {
    data: CommandAction[];
  };
  time_created?: string;
  time_started?: string;
}

// Функция для перемещения команды в историю
const moveCommandToHistory = async (commandId: string): Promise<boolean> => {
  console.log(`[History] Moving command ${commandId} to history`);
  try {
    console.log('[History] Sending request to move command to history...');
    const response = await fetch('http://localhost:5000/move_to_history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: [commandId] }),
    });
    
    if (!response.ok) {
      console.error(`[History] Failed to move command to history. Server returned status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`[History] Command ${commandId} successfully moved to history. Server response status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('[History] Error moving command to history:', error);
    return false;
  }
};

// Функция для поиска элемента с таймаутом
const findElementWithTimeout = async (tabId: number, xpath: string, timeout: number): Promise<boolean> => {
  console.log(`[Find] Starting search for element with xpath: ${xpath}`);
  console.log(`[Find] Timeout set to: ${timeout}ms`);
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (xpath: string) => {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          return !!element;
        },
        args: [xpath]
      });

      if (results[0].result) {
        console.log(`[Find] Element found after ${attempts} attempts (${Date.now() - startTime}ms)`);
        return true;
      }

      console.log(`[Find] Attempt ${attempts}: Element not found, waiting 100ms...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[Find] Error in attempt ${attempts}:`, error);
      return false;
    }
  }
  
  console.log(`[Find] Element not found after ${attempts} attempts (${timeout}ms timeout)`);
  return false;
};

// Функция для ввода текста
const inputText = async (tabId: number, xpath: string, value: string): Promise<boolean> => {
  console.log(`[Input] Attempting to input text: "${value}" into element: ${xpath}`);
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (xpath: string, value: string) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!(element instanceof HTMLInputElement)) {
          console.log('[Input] Element is not an input element');
          return false;
        }

        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      },
      args: [xpath, value]
    });

    if (results[0].result) {
      console.log('[Input] Text input successful');
    } else {
      console.log('[Input] Failed to input text');
    }
    return results[0].result;
  } catch (error) {
    console.error('[Input] Error in inputText:', error);
    return false;
  }
};

// Функция для клика
const clickElement = async (tabId: number, xpath: string): Promise<boolean> => {
  console.log(`[Click] Attempting to click element: ${xpath}`);
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (xpath: string) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!(element instanceof HTMLElement)) {
          console.log('[Click] Element is not clickable');
          return false;
        }

        element.click();
        return true;
      },
      args: [xpath]
    });

    if (results[0].result) {
      console.log('[Click] Click successful');
    } else {
      console.log('[Click] Failed to click element');
    }
    return results[0].result;
  } catch (error) {
    console.error('[Click] Error in clickElement:', error);
    return false;
  }
};

// Функция для перехода по URL
const goToUrl = async (tabId: number, url: string): Promise<boolean> => {
  console.log(`[Navigation] Attempting to navigate to: ${url}`);
  try {
    await chrome.tabs.update(tabId, { url });
    console.log('[Navigation] Navigation successful');
    return true;
  } catch (error) {
    console.error('[Navigation] Error in goToUrl:', error);
    return false;
  }
};

// Основная функция выполнения команды
const executeCommand = async (command: JsonCommand, tabId: number): Promise<boolean> => {
  console.log('\n[Command] ====== Starting command execution ======');
  console.log(`[Command] ID: ${command.id}`);
  console.log(`[Command] Created: ${command.time_created}`);
  console.log(`[Command] Steps count: ${command.params.data.length}`);
  
  // Устанавливаем время начала выполнения
  const startTime = new Date().toISOString();
  command.time_started = startTime;
  console.log(`[Command] Started at: ${startTime}`);

  for (const [index, step] of command.params.data.entries()) {
    console.log(`\n[Step ${index + 1}/${command.params.data.length}] Processing step:`, step);
    console.log(`[Step ${index + 1}] Action type: ${step.action}`);
    console.log(`[Step ${index + 1}] Timeout: ${step.on_start}ms`);

    // Для всех действий кроме 'go', нужно найти элемент
    if (step.action !== 'go' && step.element_xpath) {
      console.log(`[Step ${index + 1}] Searching for element with timeout: ${step.on_start}ms`);
      const elementFound = await findElementWithTimeout(tabId, step.element_xpath, step.on_start);
      
      if (!elementFound) {
        console.log(`[Step ${index + 1}] Element not found within ${step.on_start}ms, skipping command`);
        await moveCommandToHistory(command.id);
        return true; // Считаем команду выполненной
      }
    } else if (step.on_start > 0) {
      console.log(`[Step ${index + 1}] Waiting ${step.on_start}ms before action`);
      await new Promise(resolve => setTimeout(resolve, step.on_start));
    }

    // Выполняем действие
    let success = false;
    switch (step.action) {
      case 'go':
        success = await goToUrl(tabId, step.value);
        break;
      case 'input':
        if (step.element_xpath) {
          success = await inputText(tabId, step.element_xpath, step.value);
        }
        break;
      case 'click':
        if (step.element_xpath) {
          success = await clickElement(tabId, step.element_xpath);
        }
        break;
    }

    if (!success) {
      console.error(`[Step ${index + 1}] Failed to execute step: ${step.action}`);
      return false;
    }
    
    console.log(`[Step ${index + 1}] Successfully completed`);
  }

  await moveCommandToHistory(command.id);
  const endTime = new Date().toISOString();
  console.log(`\n[Command] Command ${command.id} completed successfully`);
  console.log(`[Command] Started: ${startTime}`);
  console.log(`[Command] Finished: ${endTime}`);
  console.log('[Command] ====== Command execution finished ======\n');
  return true;
};

// Функция для получения новых команд
const fetchNewCommands = async (): Promise<JsonCommand[]> => {
  console.log('[Fetch] Checking for new commands...');
  try {
    const response = await fetch('http://localhost:5000/select_last?count=4');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const commands = await response.json();
    if (commands.length > 0) {
      console.log(`[Fetch] Found ${commands.length} new commands`);
    }
    return commands;
  } catch (error) {
    console.error('[Fetch] Error fetching commands:', error);
    return [];
  }
};

// Основной цикл проверки команд
const checkForCommands = async () => {
  console.log('\n[Main] Starting command check cycle');
  
  try {
    // Получаем активную вкладку
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      console.log('[Main] No active tab found');
      return;
    }
    
    const tabId = tabs[0].id;
    if (!tabId) {
      console.log('[Main] No tab ID found');
      return;
    }

    // Получаем новые команды
    const commands = await fetchNewCommands();
    
    // Если есть команды, выполняем их последовательно
    for (const command of commands) {
      await executeCommand(command, tabId);
    }
  } catch (error) {
    console.error('[Main] Error in check cycle:', error);
  }
  
  // Запускаем следующую проверку через 1 секунду
  setTimeout(checkForCommands, 1000);
};

// Запускаем цикл проверки при загрузке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Init] Extension installed, starting command check cycle');
  checkForCommands();
});